#!/usr/bin/env python3
"""Regenerate the portfolio rows in tidbits_dev_seed.sql so every account tells one consistent story.

One simulated year of daily closing prices (ending at each instrument's seeded last_price) drives
deposits, withdrawals and filled/rejected orders per account. From that single ledger it writes:

  accounts.cash_balance        = deposits - withdrawals - buys + sells
  account_holdings             = net filled quantity, cost basis reduced pro rata on sells (as OrderService does)
  orders / order_status_history / account_transactions / transaction_logs for every trade and cash move
  portfolio_snapshots          = cash + holdings at that day's close, one per trading day per account

Timestamps are SQL expressions relative to CURRENT_DATE, so the history always ends on the day the
database is initialised. spread_timestamps.sql must not re-space these tables.

Usage: python3 db/generate_portfolio_seed.py   (rewrites db/tidbits_dev_seed.sql in place; deterministic)
"""
import datetime as dt
import decimal
import math
import random
import re
from pathlib import Path

SEED_FILE = Path(__file__).with_name('tidbits_dev_seed.sql')
RNG = random.Random(20261024)
HISTORY_DAYS = 395  # calendar days of price history; accounts open within this window

GENERATED_TABLES = ['accounts', 'account_holdings', 'orders', 'order_status_history',
                    'account_transactions', 'portfolio_snapshots', 'transaction_logs']
GENERATED_SEQUENCES = ['accounts_account_id_seq', 'orders_order_id_seq', 'account_transactions_transaction_id_seq',
                       'portfolio_snapshots_snapshot_id_seq', 'transaction_logs_log_id_seq']

# Per-ticker annual drift and volatility, and beta to a shared market factor.
TICKER_PROFILE = {
    'AAPL': (0.14, 0.26, 1.1), 'MSFT': (0.15, 0.24, 1.0), 'NVDA': (0.35, 0.50, 1.6), 'AMZN': (0.18, 0.32, 1.2),
    'GOOGL': (0.16, 0.30, 1.1), 'GOOG': (0.16, 0.30, 1.1), 'META': (0.22, 0.38, 1.3), 'BRK.B': (0.10, 0.17, 0.8),
    'LLY': (0.28, 0.33, 0.6), 'AVGO': (0.30, 0.42, 1.4), 'TSLA': (0.15, 0.60, 1.8), 'JPM': (0.12, 0.22, 1.0),
    'WMT': (0.14, 0.18, 0.5), 'UNH': (-0.05, 0.30, 0.6), 'MA': (0.13, 0.21, 1.0), 'XOM': (0.04, 0.24, 0.7),
    'JNJ': (0.06, 0.16, 0.5), 'PG': (0.07, 0.15, 0.4), 'ORCL': (0.25, 0.36, 1.2),
}

STYLES = {
    # target cash share, buy chunk as share of investable cash, chance to trade per day, universe
    'core':   dict(cash=0.04, chunk=0.55, trade_p=0.35, sell_p=0.0015,
                   universe=['BRK.B', 'MSFT', 'AAPL', 'JPM', 'GOOGL', 'WMT', 'MA', 'PG', 'JNJ', 'AMZN']),
    'growth': dict(cash=0.06, chunk=0.45, trade_p=0.30, sell_p=0.012,
                   universe=['NVDA', 'MSFT', 'META', 'AVGO', 'AMZN', 'GOOG', 'LLY', 'ORCL', 'TSLA', 'AAPL']),
    'income': dict(cash=0.08, chunk=0.50, trade_p=0.25, sell_p=0.0015,
                   universe=['JNJ', 'PG', 'XOM', 'JPM', 'WMT', 'BRK.B', 'MA', 'UNH']),
    'trader': dict(cash=0.30, chunk=0.25, trade_p=0.45, sell_p=0.10,
                   universe=['TSLA', 'NVDA', 'META', 'AMZN', 'AVGO', 'ORCL', 'AAPL', 'GOOGL', 'LLY', 'UNH']),
}

# account_id, user_id, nickname, days since opened, opening deposit, monthly contribution, style, one-off withdrawals
ACCOUNTS = [
    (1, 1, 'Brokerage', 378, 40000, 1000, 'core', [(140, 3000)]),
    (2, 1, 'Roth IRA', 362, 7000, 580, 'growth', []),
    (3, 1, 'Active Trading', 300, 15000, 0, 'trader', [(60, 2500)]),
    (4, 4, 'Brokerage', 374, 18000, 400, 'core', []),
    (5, 4, 'Tech Picks', 92, 8000, 0, 'growth', []),
    (6, 5, 'Main', 380, 50000, 1500, 'growth', [(200, 6000)]),
    (7, 5, 'Dividend Income', 368, 30000, 0, 'income', []),
    (8, 2, 'Individual', 371, 25000, 500, 'income', []),
    (9, 3, 'Brokerage', 382, 60000, 2000, 'growth', [(95, 5000)]),
    (10, 3, 'Roth IRA', 366, 7000, 0, 'core', []),
    (11, 3, 'Swing Trades', 205, 20000, 0, 'trader', []),
    (12, 3, "Kids' College", 152, 10000, 250, 'income', []),
    (13, 6, 'Main Account', 385, 75000, 1500, 'growth', [(175, 8000)]),
    (14, 6, 'Retirement', 377, 40000, 800, 'core', []),
]
ANNUAL_IRA_DEPOSIT = {10: 7000}  # lump-sum contribution on the first trading day of the year


def ts(days_ago, seconds):
    """Timestamp expression `days_ago` calendar days before the init date, `seconds` after midnight."""
    h, rem = divmod(seconds, 3600)
    m, s = divmod(rem, 60)
    return f"(CURRENT_DATE - {days_ago} + TIME '{int(h):02d}:{int(m):02d}:{s:09.6f}')"


def money(x):
    return f'{x:.2f}'


def cents(x):
    """Round half-up to cents, as Postgres does when storing NUMERIC(15, 2)."""
    return float(decimal.Decimal(repr(x)).quantize(decimal.Decimal('0.01'), rounding=decimal.ROUND_HALF_UP))


def floor2(x):
    return math.floor(x * 100 + 1e-6) / 100


def load_instruments(sql):
    pattern = re.compile(r"INSERT INTO public\.instruments \(.*?\) VALUES \((\d+), '([^']+)', .*?, '[^']*', '[^']*', ([\d.]+|NULL),")
    priced = {}
    for match in pattern.finditer(sql):
        if match.group(3) != 'NULL':
            # last_price is NUMERIC(15, 2), so value holdings at the price Postgres will store.
            priced[match.group(2)] = (int(match.group(1)), cents(float(match.group(3))))
    missing = set(TICKER_PROFILE) - set(priced)
    if missing:
        raise SystemExit(f'Instruments without a seeded last_price: {sorted(missing)}')
    return priced


def simulate_prices(instruments, today):
    """Closing prices by days_ago for each ticker; weekdays only, ending at last_price today."""
    trading_days = [d for d in range(HISTORY_DAYS, -1, -1) if (today - dt.timedelta(days=d)).weekday() < 5]
    market = {d: RNG.gauss(0.0, 0.0085) for d in trading_days}
    years = len(trading_days) / 252
    closes = {}
    for ticker, (mu, sigma, beta) in TICKER_PROFILE.items():
        idio = math.sqrt(max(sigma ** 2 / 252 - (beta * 0.0085) ** 2, (sigma * 0.4) ** 2 / 252))
        returns = {d: beta * market[d] + RNG.gauss(0.0, idio) for d in trading_days}
        # Random noise shapes the path; the year's total return is pinned near the ticker's drift so
        # the history reads like a normal year (mostly up, with drawdowns) rather than a random walk.
        target = math.log1p(mu) * years + RNG.gauss(0.0, 0.04)
        shift = (target - sum(returns.values())) / len(returns)
        price = instruments[ticker][1]
        series = {}
        for d in reversed(trading_days):  # walk backwards from today
            series[d] = cents(price)
            price /= math.exp(returns[d] + shift)
        closes[ticker] = series
    return trading_days, closes


class Ledger:
    def __init__(self):
        self.orders, self.history, self.transactions, self.logs = [], [], [], []
        self.order_id = self.tx_id = self.log_id = 0

    def cash_move(self, acct, user_id, kind, amount, days_ago, sec):
        self.tx_id += 1
        self.transactions.append((self.tx_id, acct, 'NULL', money(amount), kind, ts(days_ago, sec)))
        self.log(user_id, acct, kind, amount, self.tx_id, None, 'SUCCESS', days_ago, sec + 0.05)

    def order(self, acct, user_id, instrument_id, qty, price, side, filled, days_ago, sec):
        self.order_id += 1
        oid, notional = self.order_id, floor2(qty * price)
        self.orders.append((oid, acct, instrument_id, qty, money(price), side, 'FILLED' if filled else 'REJECTED'))
        self.history.append((oid, ts(days_ago, sec), 'NULL', 'PLACED'))
        self.log(user_id, acct, 'ORDER_PLACED', notional, None, oid, 'SUCCESS', days_ago, sec + 0.03)
        if not filled:
            self.history.append((oid, ts(days_ago, sec + 0.4), "'PLACED'", 'REJECTED'))
            self.log(user_id, acct, 'ORDER_REJECTED', notional, None, oid, 'FAILURE', days_ago, sec + 0.43)
            return notional
        accepted = sec + RNG.uniform(0.2, 1.8)
        self.tx_id += 1
        self.transactions.append((self.tx_id, acct, str(oid), money(notional), side, ts(days_ago, accepted - 0.01)))
        self.history.append((oid, ts(days_ago, accepted), "'PLACED'", 'ACCEPTED'))
        self.log(user_id, acct, 'ORDER_ACCEPTED', notional, self.tx_id, oid, 'SUCCESS', days_ago, accepted + 0.01)
        filled_at = accepted + RNG.uniform(0.01, 0.5)
        self.history.append((oid, ts(days_ago, filled_at), "'ACCEPTED'", 'FILLED'))
        self.log(user_id, acct, 'ORDER_FILLED', notional, self.tx_id, oid, 'SUCCESS', days_ago, filled_at + 0.02)
        return notional

    def log(self, user_id, acct, event, amount, tx, oid, status, days_ago, sec):
        self.log_id += 1
        self.logs.append((self.log_id, user_id, acct, event, money(amount),
                          'NULL' if tx is None else str(tx), 'NULL' if oid is None else str(oid), status, ts(days_ago, sec)))


# Each day runs deposits (before the open), sells, withdrawals, then buys, so cash never dips below zero intraday.
def sell_time():
    return RNG.uniform(9.6 * 3600, 11.4 * 3600)


def buy_time():
    return RNG.uniform(12.1 * 3600, 15.8 * 3600)


def run_account(spec, trading_days, closes, instruments, today, ledger):
    acct, user_id, nickname, opened, initial, monthly, style_name, withdrawals = spec
    style = STYLES[style_name]
    universe = style['universe']
    weights = {t: RNG.uniform(0.6, 1.4) for t in universe}
    cash, positions, last_trade = 0.0, {}, {}
    snapshots = []
    withdraw_days = dict(withdrawals)
    days = [d for d in trading_days if d <= opened]
    prev_month = None

    for i, d in enumerate(days):
        date = today - dt.timedelta(days=d)
        is_today = d == 0
        if i == 0:
            cash += initial
            ledger.cash_move(acct, user_id, 'DEPOSIT', initial, d, 9.2 * 3600 + RNG.uniform(0, 1800))
        elif date.month != prev_month and not is_today:
            if monthly:
                cash += monthly
                ledger.cash_move(acct, user_id, 'DEPOSIT', monthly, d, 8 * 3600 + RNG.uniform(0, 3600))
            if date.month == 1 and acct in ANNUAL_IRA_DEPOSIT:
                cash += ANNUAL_IRA_DEPOSIT[acct]
                ledger.cash_move(acct, user_id, 'DEPOSIT', ANNUAL_IRA_DEPOSIT[acct], d, 8.5 * 3600 + RNG.uniform(0, 3600))
        prev_month = date.month

        prices = {t: closes[t][d] for t in universe}

        for when, amount in list(withdraw_days.items()):
            if d > when or is_today:
                continue
            if cash < amount and positions:
                # Raise the cash first by selling part of the largest position.
                t = max(positions, key=lambda k: positions[k][0] * prices[k])
                qty, cost = positions[t]
                sell_qty = min(qty, math.ceil((amount - cash) / prices[t]) + 1)
                cash += ledger.order(acct, user_id, instruments[t][0], sell_qty, prices[t], 'SELL', True, d, sell_time())
                if qty - sell_qty:
                    positions[t] = (qty - sell_qty, cost * (qty - sell_qty) / qty)
                else:
                    del positions[t]
                last_trade[t] = (d, None)
            if cash >= amount:
                cash -= amount
                ledger.cash_move(acct, user_id, 'WITHDRAW', amount, d, 11.6 * 3600 + RNG.uniform(0, 1200))
                del withdraw_days[when]
        holdings_value = sum(q * prices[t] for t, (q, _) in positions.items())
        total = cash + holdings_value

        # No trading on the init day itself: its market hours may still be in the future.
        if not is_today:
            # Sells: profit-taking, stop-losses and trims.
            for t, (qty, cost) in list(positions.items()):
                gain = qty * prices[t] / cost - 1
                p = style['sell_p']
                if style_name == 'trader':
                    p = 0.35 if gain > 0.09 else 0.45 if gain < -0.07 else 0.03
                elif qty * prices[t] > total * 0.3:
                    p = 0.2
                if RNG.random() < p:
                    sell_qty = qty if style_name == 'trader' or qty <= 2 else max(1, int(qty * RNG.uniform(0.25, 0.6)))
                    fill = cents(prices[t] * (1 + RNG.gauss(0, 0.003)))
                    proceeds = ledger.order(acct, user_id, instruments[t][0], sell_qty, fill, 'SELL', True, d, sell_time())
                    cash += proceeds
                    remaining = qty - sell_qty
                    if remaining:
                        positions[t] = (remaining, cost * remaining / qty)
                    else:
                        del positions[t]
                    last_trade[t] = (d, None)

            # Buys: deploy cash above the style's target cash share.
            investable = cash - style['cash'] * total
            if investable > 400 and RNG.random() < style['trade_p']:
                held_weight = {t: (positions.get(t, (0, 0))[0] * prices[t]) / max(total, 1) for t in universe}
                pick = max(universe, key=lambda t: weights[t] * RNG.uniform(0.5, 1.5) - held_weight[t] * 3)
                budget = investable * (style['chunk'] * RNG.uniform(0.7, 1.3) if investable > 2500 else 1.0)
                fill = cents(prices[pick] * (1 + RNG.gauss(0, 0.003)))
                qty = int(budget // fill)
                if qty >= 1:
                    sec = buy_time()
                    if RNG.random() < 0.03:
                        # Occasional order that overshoots available cash and is rejected.
                        ledger.order(acct, user_id, instruments[pick][0], int(cash // fill) + RNG.randint(2, 6), fill, 'BUY', False, d, sec)
                        sec += RNG.uniform(30, 180)
                    cost = ledger.order(acct, user_id, instruments[pick][0], qty, fill, 'BUY', True, d, sec)
                    cash -= cost
                    q0, c0 = positions.get(pick, (0, 0.0))
                    positions[pick] = (q0 + qty, c0 + cost)
                    last_trade[pick] = (d, sec)

        cash = cents(cash)
        value = cents(cash + sum(q * prices[t] for t, (q, _) in positions.items()))
        at = "LEAST(now()::timestamp, CURRENT_DATE + TIME '16:00:00')" if is_today else ts(d, 16 * 3600 + RNG.uniform(0, 30))
        snapshots.append((acct, money(value), at))

    created = ts(opened, 9 * 3600 + RNG.uniform(0, 600))
    holdings = [(acct, instruments[t][0], qty, money(cost), ts(last_trade[t][0], 16 * 3600 + 120))
                for t, (qty, cost) in sorted(positions.items(), key=lambda kv: instruments[kv[0]][0])]
    return (acct, user_id, nickname, money(cash), created), holdings, snapshots


def block(table, columns, rows):
    head = f'--\n-- Data for Name: {table}; Type: TABLE DATA; Schema: public; Owner: -\n--\n\n'
    body = ''.join(f"INSERT INTO public.{table} ({columns}) VALUES ({', '.join(map(str, r))});\n" for r in rows)
    return head + body + '\n\n'


def sequence(name, value):
    return (f'--\n-- Name: {name}; Type: SEQUENCE SET; Schema: public; Owner: -\n--\n\n'
            f"SELECT pg_catalog.setval('public.{name}', {value}, true);\n\n\n")


def main():
    sql = SEED_FILE.read_text()
    instruments = load_instruments(sql)
    today = dt.date.today()
    trading_days, closes = simulate_prices(instruments, today)

    ledger = Ledger()
    accounts, holdings, snapshots = [], [], []
    for spec in sorted(ACCOUNTS, key=lambda s: -s[3]):
        account, held, snaps = run_account(spec, trading_days, closes, instruments, today, ledger)
        accounts.append(account)
        holdings += held
        snapshots += snaps
    accounts.sort()

    tables = '|'.join(map(re.escape, GENERATED_TABLES))
    sql = re.sub(rf'(?:--\n)?-- Data for Name: ({tables}); Type: TABLE DATA; Schema: public; Owner: -\n--\n\n(?:INSERT INTO [^\n]*\n)*\n*', '', sql)
    seqs = '|'.join(map(re.escape, GENERATED_SEQUENCES))
    sql = re.sub(rf"--\n-- Name: ({seqs}); Type: SEQUENCE SET; Schema: public; Owner: -\n--\n\nSELECT [^\n]*\n\n*", '', sql)

    nickname = lambda a: "'" + a[2].replace("'", "''") + "'"
    generated = (
        block('accounts', 'account_id, user_id, nickname, cash_balance, created_at',
              [(a[0], a[1], nickname(a), a[3], a[4]) for a in accounts])
        + block('account_holdings', 'account_id, instrument_id, quantity, amount_invested, last_updated', holdings)
        + block('orders', 'order_id, account_id, instrument_id, quantity, stock_price, order_type, status',
                [(o[0], o[1], o[2], o[3], o[4], f"'{o[5]}'", f"'{o[6]}'") for o in ledger.orders])
        + block('order_status_history', 'order_id, changed_at, old_status, new_status',
                [(h[0], h[1], h[2], f"'{h[3]}'") for h in ledger.history])
        + block('account_transactions', 'transaction_id, account_id, order_id, amount, transaction_type, created_at',
                [(t[0], t[1], t[2], t[3], f"'{t[4]}'", t[5]) for t in ledger.transactions])
        + block('portfolio_snapshots', 'snapshot_id, account_id, total_value, created_at',
                [(i + 1, *s) for i, s in enumerate(snapshots)])
        + block('transaction_logs', 'log_id, user_id, account_id, event, amount, transaction_id, order_id, status, happened_at',
                [(l[0], l[1], l[2], f"'{l[3]}'", l[4], l[5], l[6], f"'{l[7]}'", l[8]) for l in ledger.logs])
    )
    sequences = (sequence('accounts_account_id_seq', max(a[0] for a in accounts))
                 + sequence('orders_order_id_seq', ledger.order_id)
                 + sequence('account_transactions_transaction_id_seq', ledger.tx_id)
                 + sequence('portfolio_snapshots_snapshot_id_seq', len(snapshots))
                 + sequence('transaction_logs_log_id_seq', ledger.log_id))

    first_sequence = sql.index('--\n-- Name: ', sql.index('Type: TABLE DATA'))
    sql = sql[:first_sequence] + generated + sequences + sql[first_sequence:]
    SEED_FILE.write_text(sql)
    print(f'{len(accounts)} accounts, {len(holdings)} holdings, {len(ledger.orders)} orders, '
          f'{len(ledger.transactions)} transactions, {len(snapshots)} snapshots, {len(ledger.logs)} logs')


if __name__ == '__main__':
    main()

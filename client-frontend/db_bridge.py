"""
Database Bridge Server for Traders, Tickers, and Triumph
Connects Angular Client Frontend directly to PostgreSQL Database (tidbits)
"""

import sys
import os
from pathlib import Path
import json
import decimal
import datetime
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.parse

# Ensure root directory is in sys.path to import data.database
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from data.database import db

# Realistic benchmark pricing & daily performance for the 12 database instruments
INSTRUMENT_MARKET_BENCHMARKS = {
    'AAPL': {'price': 224.25, 'changePercent': 1.84, 'changeAmount': 4.05, 'volume': 64280000, 'marketCap': '3.42T', 'dayHigh': 225.40, 'dayLow': 220.10, 'sparkline': [219, 220.5, 221, 223, 222.4, 224.25]},
    'MSFT': {'price': 442.80, 'changePercent': 2.15, 'changeAmount': 9.32, 'volume': 38400000, 'marketCap': '3.29T', 'dayHigh': 445.00, 'dayLow': 436.50, 'sparkline': [433, 436, 439, 440, 442.8]},
    'GOOGL': {'price': 178.50, 'changePercent': 0.94, 'changeAmount': 1.66, 'volume': 29500000, 'marketCap': '2.21T', 'dayHigh': 180.10, 'dayLow': 176.90, 'sparkline': [176.5, 177, 178.1, 177.8, 178.5]},
    'TSLA': {'price': 243.60, 'changePercent': -1.72, 'changeAmount': -4.26, 'volume': 91400000, 'marketCap': '775B', 'dayHigh': 251.20, 'dayLow': 241.50, 'sparkline': [250, 248.5, 246, 244.2, 243.6]},
    'JPM': {'price': 216.70, 'changePercent': -0.85, 'changeAmount': -1.86, 'volume': 18900000, 'marketCap': '620B', 'dayHigh': 219.00, 'dayLow': 215.80, 'sparkline': [219, 218.5, 217.4, 216.2, 216.7]},
    'US10Y': {'price': 98.40, 'changePercent': 0.12, 'changeAmount': 0.12, 'volume': 15200000, 'marketCap': 'N/A', 'dayHigh': 98.65, 'dayLow': 98.20, 'sparkline': [98.1, 98.2, 98.35, 98.38, 98.40]},
    'VTSAX': {'price': 132.85, 'changePercent': 0.78, 'changeAmount': 1.03, 'volume': 22500000, 'marketCap': '1.5T', 'dayHigh': 133.10, 'dayLow': 131.90, 'sparkline': [131.5, 132.0, 132.4, 132.6, 132.85]},
    'SPY': {'price': 558.90, 'changePercent': 0.62, 'changeAmount': 3.45, 'volume': 82140000, 'marketCap': '550B', 'dayHigh': 560.10, 'dayLow': 556.20, 'sparkline': [554, 555.2, 556.8, 557.5, 558.9]},
    'QQQ': {'price': 478.30, 'changePercent': 1.35, 'changeAmount': 6.37, 'volume': 53200000, 'marketCap': '280B', 'dayHigh': 480.20, 'dayLow': 473.10, 'sparkline': [471, 474, 476.5, 477.2, 478.3]},
    'BND': {'price': 74.20, 'changePercent': 0.18, 'changeAmount': 0.13, 'volume': 12100000, 'marketCap': '105B', 'dayHigh': 74.45, 'dayLow': 74.05, 'sparkline': [74.05, 74.1, 74.15, 74.22, 74.2]},
    'F': {'price': 11.24, 'changePercent': -2.43, 'changeAmount': -0.28, 'volume': 48900000, 'marketCap': '44.8B', 'dayHigh': 11.60, 'dayLow': 11.15, 'sparkline': [11.55, 11.45, 11.38, 11.2, 11.24]},
    'IBM': {'price': 218.40, 'changePercent': 0.82, 'changeAmount': 1.78, 'volume': 9800000, 'marketCap': '201B', 'dayHigh': 219.80, 'dayLow': 216.50, 'sparkline': [216, 217.2, 217.9, 218.1, 218.4]}
}

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, decimal.Decimal):
            return float(obj)
        if isinstance(obj, (datetime.date, datetime.datetime)):
            return obj.isoformat()
        return super().default(obj)

class DbBridgeHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, status_code, data):
        body = json.dumps(data, cls=CustomJSONEncoder).encode('utf-8')
        self.send_response(status_code)
        self._send_cors_headers()
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            raw = self.rfile.read(content_length)
            return json.loads(raw.decode('utf-8'))
        return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')

        try:
            # Health check
            if path == '/api/health':
                with db.get_cursor() as cur:
                    cur.execute("SELECT 1;")
                return self._send_json(200, {"status": "ok", "database": "connected"})

            # Sample test credentials for login screen
            if path == '/api/users/sample':
                with db.get_cursor(dict_cursor=True) as cur:
                    cur.execute("""
                        SELECT u.user_id, u.username, u.password_hash, u.email,
                               COUNT(a.account_id) as account_count
                        FROM users u
                        LEFT JOIN accounts a ON u.user_id = a.user_id
                        GROUP BY u.user_id, u.username, u.password_hash, u.email
                        ORDER BY u.user_id ASC
                        LIMIT 6;
                    """)
                    rows = cur.fetchall()
                return self._send_json(200, rows)

            # Database Instruments (only the stocks in the database)
            if path == '/api/instruments':
                with db.get_cursor(dict_cursor=True) as cur:
                    cur.execute("SELECT instrument_id, ticker, name, type, market FROM instruments ORDER BY instrument_id ASC;")
                    rows = cur.fetchall()

                # Enrich with benchmark price metrics for live trading & ranking
                enriched = []
                for r in rows:
                    ticker = r['ticker']
                    bench = INSTRUMENT_MARKET_BENCHMARKS.get(ticker, {
                        'price': 100.0,
                        'changePercent': 0.0,
                        'changeAmount': 0.0,
                        'volume': 1000000,
                        'marketCap': '10B',
                        'dayHigh': 102.0,
                        'dayLow': 98.0,
                        'sparkline': [100, 100, 100]
                    })
                    item = dict(r)
                    item.update(bench)
                    item['volumeFormatted'] = f"{item['volume'] / 1_000_000:.1f}M"
                    enriched.append(item)
                return self._send_json(200, enriched)

            # User accounts: /api/user/<userId>/accounts
            if path.startswith('/api/user/') and path.endswith('/accounts'):
                parts = path.split('/')
                user_id = int(parts[3])
                with db.get_cursor(dict_cursor=True) as cur:
                    cur.execute("""
                        SELECT account_id, user_id, nickname, cash_balance, created_at
                        FROM accounts
                        WHERE user_id = %s
                        ORDER BY account_id ASC;
                    """, (user_id,))
                    accounts = cur.fetchall()
                return self._send_json(200, accounts)

            # Single account: /api/accounts/<accountId>
            if path.startswith('/api/accounts/') and len(path.split('/')) == 4:
                account_id = int(path.split('/')[3])
                with db.get_cursor(dict_cursor=True) as cur:
                    cur.execute("""
                        SELECT account_id, user_id, nickname, cash_balance, created_at
                        FROM accounts
                        WHERE account_id = %s;
                    """, (account_id,))
                    account = cur.fetchone()
                if not account:
                    return self._send_json(404, {"error": "Account not found"})
                return self._send_json(200, account)

            # Account holdings: /api/accounts/<accountId>/holdings
            if path.startswith('/api/accounts/') and path.endswith('/holdings'):
                account_id = int(path.split('/')[3])
                with db.get_cursor(dict_cursor=True) as cur:
                    cur.execute("""
                        SELECT h.account_id, h.instrument_id, h.quantity, h.amount_invested, h.last_updated,
                               i.ticker, i.name, i.type, i.market
                        FROM account_holdings h
                        JOIN instruments i ON h.instrument_id = i.instrument_id
                        WHERE h.account_id = %s AND h.quantity > 0
                        ORDER BY i.ticker ASC;
                    """, (account_id,))
                    rows = cur.fetchall()

                holdings = []
                for r in rows:
                    item = dict(r)
                    bench = INSTRUMENT_MARKET_BENCHMARKS.get(r['ticker'], {'price': 100.0, 'changePercent': 0.0, 'changeAmount': 0.0})
                    current_price = float(bench['price'])
                    qty = float(r['quantity'])
                    invested = float(r['amount_invested'])
                    total_value = qty * current_price
                    avg_cost = invested / qty if qty > 0 else 0
                    unrealized_gain = total_value - invested
                    unrealized_gain_pct = (unrealized_gain / invested) * 100 if invested > 0 else 0

                    item['currentPrice'] = current_price
                    item['changePercent'] = bench['changePercent']
                    item['totalValue'] = total_value
                    item['avgCost'] = avg_cost
                    item['unrealizedGain'] = unrealized_gain
                    item['unrealizedGainPct'] = unrealized_gain_pct
                    holdings.append(item)

                return self._send_json(200, holdings)

            # Account order history: /api/accounts/<accountId>/orders
            if path.startswith('/api/accounts/') and path.endswith('/orders'):
                account_id = int(path.split('/')[3])
                with db.get_cursor(dict_cursor=True) as cur:
                    cur.execute("""
                        SELECT o.order_id, o.account_id, o.instrument_id, o.quantity, o.stock_price, o.order_type, o.status,
                               i.ticker, i.name,
                               COALESCE(MIN(osh.changed_at), NOW()) as created_at
                        FROM orders o
                        JOIN instruments i ON o.instrument_id = i.instrument_id
                        LEFT JOIN order_status_history osh ON o.order_id = osh.order_id
                        WHERE o.account_id = %s
                        GROUP BY o.order_id, o.account_id, o.instrument_id, o.quantity, o.stock_price, o.order_type, o.status, i.ticker, i.name
                        ORDER BY o.order_id DESC;
                    """, (account_id,))
                    orders = cur.fetchall()

                return self._send_json(200, orders)

            self._send_json(404, {"error": f"Endpoint {path} not found"})

        except Exception as e:
            self._send_json(500, {"error": str(e)})

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path.rstrip('/')

        try:
            # Login authentication against database credentials
            if path == '/api/login':
                body = self._read_json_body()
                username = body.get('username', '').strip()
                password_hash = body.get('password_hash', '').strip()

                with db.get_cursor(dict_cursor=True) as cur:
                    cur.execute("""
                        SELECT user_id, role_id, username, email, phone_number, reward_points
                        FROM users
                        WHERE username = %s AND password_hash = %s;
                    """, (username, password_hash))
                    user = cur.fetchone()

                    if not user:
                        return self._send_json(401, {"success": False, "error": "Invalid username or password_hash in database."})

                    # Fetch user's accounts
                    cur.execute("""
                        SELECT account_id, user_id, nickname, cash_balance, created_at
                        FROM accounts
                        WHERE user_id = %s
                        ORDER BY account_id ASC;
                    """, (user['user_id'],))
                    accounts = cur.fetchall()

                return self._send_json(200, {
                    "success": True,
                    "user": user,
                    "accounts": accounts
                })

            # Execute trade order in PostgreSQL database
            if path == '/api/orders':
                body = self._read_json_body()
                account_id = int(body.get('accountId'))
                instrument_id = int(body.get('instrumentId'))
                order_type = body.get('orderType', 'buy').lower()
                quantity = float(body.get('quantity', 0))
                stock_price = float(body.get('stockPrice', 0))

                if quantity <= 0:
                    return self._send_json(400, {"error": "Quantity must be greater than 0."})

                total_amount = quantity * stock_price

                with db.get_connection() as conn:
                    with conn.cursor() as cur:
                        # 1. Fetch current cash balance
                        cur.execute("SELECT cash_balance FROM accounts WHERE account_id = %s FOR UPDATE;", (account_id,))
                        row = cur.fetchone()
                        if not row:
                            return self._send_json(404, {"error": "Account not found."})
                        current_cash = float(row[0])

                        # 2. Check BUY vs SELL
                        if order_type == 'buy':
                            if current_cash < total_amount:
                                return self._send_json(400, {
                                    "error": f"Insufficient funds in database. Needed: ${total_amount:.2f}, Available: ${current_cash:.2f}"
                                })

                            # Deduct cash
                            new_cash = current_cash - total_amount
                            cur.execute("UPDATE accounts SET cash_balance = %s WHERE account_id = %s;", (new_cash, account_id))

                            # Update or insert into account_holdings
                            cur.execute("""
                                SELECT quantity, amount_invested 
                                FROM account_holdings 
                                WHERE account_id = %s AND instrument_id = %s;
                            """, (account_id, instrument_id))
                            holding = cur.fetchone()

                            now = datetime.datetime.now()
                            if holding:
                                old_qty, old_invested = holding
                                updated_qty = float(old_qty) + quantity
                                updated_invested = float(old_invested) + total_amount
                                cur.execute("""
                                    UPDATE account_holdings 
                                    SET quantity = %s, amount_invested = %s, last_updated = %s 
                                    WHERE account_id = %s AND instrument_id = %s;
                                """, (updated_qty, updated_invested, now, account_id, instrument_id))
                            else:
                                cur.execute("""
                                    INSERT INTO account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated)
                                    VALUES (%s, %s, %s, %s, %s);
                                """, (account_id, instrument_id, quantity, total_amount, now))

                        elif order_type == 'sell':
                            cur.execute("""
                                SELECT quantity, amount_invested 
                                FROM account_holdings 
                                WHERE account_id = %s AND instrument_id = %s;
                            """, (account_id, instrument_id))
                            holding = cur.fetchone()

                            if not holding or float(holding[0]) < quantity:
                                owned = float(holding[0]) if holding else 0
                                return self._send_json(400, {"error": f"Insufficient shares owned. Current holdings: {owned}"})

                            old_qty, old_invested = holding
                            cost_basis_fraction = (float(old_invested) / float(old_qty)) * quantity

                            new_qty = float(old_qty) - quantity
                            new_invested = max(0.0, float(old_invested) - cost_basis_fraction)
                            now = datetime.datetime.now()

                            if new_qty <= 0.0001:
                                cur.execute("DELETE FROM account_holdings WHERE account_id = %s AND instrument_id = %s;", (account_id, instrument_id))
                            else:
                                cur.execute("""
                                    UPDATE account_holdings 
                                    SET quantity = %s, amount_invested = %s, last_updated = %s 
                                    WHERE account_id = %s AND instrument_id = %s;
                                """, (new_qty, new_invested, now, account_id, instrument_id))

                            # Add proceeds to cash
                            new_cash = current_cash + total_amount
                            cur.execute("UPDATE accounts SET cash_balance = %s WHERE account_id = %s;", (new_cash, account_id))

                        # 3. Insert order
                        cur.execute("""
                            INSERT INTO orders (account_id, instrument_id, quantity, stock_price, order_type, status)
                            VALUES (%s, %s, %s, %s, %s, 'filled')
                            RETURNING order_id;
                        """, (account_id, instrument_id, quantity, stock_price, order_type))
                        order_id = cur.fetchone()[0]

                        # 4. Insert order_status_history
                        now = datetime.datetime.now()
                        cur.execute("""
                            INSERT INTO order_status_history (order_id, changed_at, old_status, new_status)
                            VALUES (%s, %s, 'created', 'filled');
                        """, (order_id, now))

                return self._send_json(200, {
                    "success": True,
                    "orderId": order_id,
                    "orderType": order_type,
                    "quantity": quantity,
                    "stockPrice": stock_price,
                    "totalAmount": total_amount,
                    "newCashBalance": new_cash
                })

            self._send_json(404, {"error": f"Endpoint {path} not found"})

        except Exception as e:
            self._send_json(500, {"error": str(e)})

def run_server(port=5001):
    server = HTTPServer(('127.0.0.1', port), DbBridgeHandler)
    print(f"Database Bridge running on http://127.0.0.1:{port}")
    server.serve_forever()

if __name__ == '__main__':
    run_server()

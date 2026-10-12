BEGIN;

-- =========================================================
-- USERS
-- Idempotent by username
-- =========================================================

WITH user_seed(
    role_name,
    username,
    email,
    password_hash,
    phone_number,
    date_of_birth
) AS (
    VALUES
        ('client'::role_type,   'johnsmith', 'john@example.com',      'hash1',  '5551000001', DATE '1990-05-15'),
        ('client'::role_type,   'janedoe',   'jane@example.com',      'hash2',  '5551000002', DATE '1988-02-20'),
        ('client'::role_type,   'mikebrown', 'mike@example.com',      'hash3',  '5551000003', DATE '1995-08-11'),
        ('client'::role_type,   'alicegreen','alice@example.com',     'hash4',  '5551000004', DATE '1992-03-05'),
        ('client'::role_type,   'bobwilson', 'bob@example.com',       'hash5',  '5551000005', DATE '1987-09-28'),
        ('auditor'::role_type,  'auditor1',  'auditor1@example.com',  'hash6',  '5551000006', DATE '1985-01-01'),
        ('auditor'::role_type,  'auditor2',  'auditor2@example.com',  'hash7',  '5551000007', DATE '1983-04-10'),
        ('reporter'::role_type, 'reporter1', 'reporter1@example.com', 'hash8',  '5551000008', DATE '1991-07-12'),
        ('reporter'::role_type, 'reporter2', 'reporter2@example.com', 'hash9',  '5551000009', DATE '1994-12-25'),
        ('admin'::role_type,    'admin1',    'admin@example.com',     'hash10', '5551000010', DATE '1980-06-15')
)
INSERT INTO users (
    role_id,
    username,
    email,
    password_hash,
    phone_number,
    date_of_birth
)
SELECT
    (
        SELECT MIN(r.role_id)
        FROM roles r
        WHERE r.name = s.role_name
    ),
    s.username,
    s.email,
    s.password_hash,
    s.phone_number,
    s.date_of_birth
FROM user_seed s
ON CONFLICT (username) DO UPDATE
SET
    role_id = EXCLUDED.role_id,
    email = EXCLUDED.email,
    password_hash = EXCLUDED.password_hash,
    phone_number = EXCLUDED.phone_number,
    date_of_birth = EXCLUDED.date_of_birth;


-- =========================================================
-- ACCOUNTS
-- Insert when user + nickname does not already exist
-- =========================================================

WITH account_seed(
    username,
    nickname,
    cash_balance
) AS (
    VALUES
        ('johnsmith', 'John Main',        25000.00::numeric),
        ('janedoe',   'Jane Trading',     50000.00::numeric),
        ('mikebrown', 'Mike Growth',      18000.00::numeric),
        ('alicegreen','Alice Retirement', 90000.00::numeric),
        ('bobwilson', 'Bob Portfolio',    12500.00::numeric)
)
INSERT INTO accounts (
    user_id,
    nickname,
    cash_balance
)
SELECT
    u.user_id,
    s.nickname,
    s.cash_balance
FROM account_seed s
JOIN users u
    ON u.username = s.username
WHERE NOT EXISTS (
    SELECT 1
    FROM accounts a
    WHERE a.user_id = u.user_id
      AND a.nickname IS NOT DISTINCT FROM s.nickname
);


-- =========================================================
-- INSTRUMENTS
-- Upsert by ticker
-- =========================================================

WITH instrument_seed(
    ticker,
    name,
    instrument_type,
    exchange,
    last_price,
    currency,
    price_change,
    change_percent,
    prev_close
) AS (
    VALUES
        ('AAPL',  'Apple Inc.',       'equity', 'NASDAQ', 195.50::numeric, 'USD',  2.30::numeric,  1.19::numeric, 193.20::numeric),
        ('MSFT',  'Microsoft Corp.',  'equity', 'NASDAQ', 425.75::numeric, 'USD', -1.50::numeric, -0.35::numeric, 427.25::numeric),
        ('GOOGL', 'Alphabet Inc.',    'equity', 'NASDAQ', 175.20::numeric, 'USD',  0.90::numeric,  0.52::numeric, 174.30::numeric),
        ('AMZN',  'Amazon.com Inc.',  'equity', 'NASDAQ', 182.40::numeric, 'USD',  3.10::numeric,  1.73::numeric, 179.30::numeric),
        ('TSLA',  'Tesla Inc.',       'equity', 'NASDAQ', 240.80::numeric, 'USD', -5.20::numeric, -2.11::numeric, 246.00::numeric),
        ('NVDA',  'NVIDIA Corp.',     'equity', 'NASDAQ', 950.00::numeric, 'USD', 12.50::numeric,  1.33::numeric, 937.50::numeric),
        ('META',  'Meta Platforms',   'equity', 'NASDAQ', 510.30::numeric, 'USD',  4.50::numeric,  0.89::numeric, 505.80::numeric),
        ('SPY',   'SPDR S&P 500 ETF', 'etf',   'NYSE',   520.00::numeric, 'USD',  1.10::numeric,  0.21::numeric, 518.90::numeric)
)
INSERT INTO instruments (
    ticker,
    name,
    type,
    exchange,
    last_price,
    currency,
    change,
    change_percent,
    prev_close
)
SELECT
    ticker,
    name,
    instrument_type,
    exchange,
    last_price,
    currency,
    price_change,
    change_percent,
    prev_close
FROM instrument_seed
ON CONFLICT (ticker) DO UPDATE
SET
    name = EXCLUDED.name,
    type = EXCLUDED.type,
    exchange = EXCLUDED.exchange,
    last_price = EXCLUDED.last_price,
    currency = EXCLUDED.currency,
    change = EXCLUDED.change,
    change_percent = EXCLUDED.change_percent,
    prev_close = EXCLUDED.prev_close,
    last_updated = CURRENT_TIMESTAMP;


-- =========================================================
-- ACCOUNT HOLDINGS
-- Upsert by account_id + instrument_id
-- =========================================================

WITH holding_seed(
    username,
    nickname,
    ticker,
    quantity,
    amount_invested
) AS (
    VALUES
        ('johnsmith', 'John Main',        'AAPL',  50.0000::numeric,  8500.00::numeric),
        ('johnsmith', 'John Main',        'MSFT',  20.0000::numeric,  7600.00::numeric),
        ('johnsmith', 'John Main',        'SPY',   10.0000::numeric,  4800.00::numeric),
        ('janedoe',   'Jane Trading',     'NVDA',  25.0000::numeric, 18000.00::numeric),
        ('janedoe',   'Jane Trading',     'MSFT',  50.0000::numeric, 20000.00::numeric),
        ('mikebrown', 'Mike Growth',      'AMZN',  30.0000::numeric,  5000.00::numeric),
        ('mikebrown', 'Mike Growth',      'TSLA',  15.0000::numeric,  4000.00::numeric),
        ('alicegreen','Alice Retirement', 'SPY',  100.0000::numeric, 45000.00::numeric),
        ('alicegreen','Alice Retirement', 'AAPL',  75.0000::numeric, 12000.00::numeric),
        ('bobwilson', 'Bob Portfolio',    'GOOGL', 40.0000::numeric,  6000.00::numeric)
)
INSERT INTO account_holdings (
    account_id,
    instrument_id,
    quantity,
    amount_invested
)
SELECT
    a.account_id,
    i.instrument_id,
    s.quantity,
    s.amount_invested
FROM holding_seed s
JOIN users u
    ON u.username = s.username
JOIN accounts a
    ON a.user_id = u.user_id
   AND a.nickname IS NOT DISTINCT FROM s.nickname
JOIN instruments i
    ON i.ticker = s.ticker
ON CONFLICT (account_id, instrument_id) DO UPDATE
SET
    quantity = EXCLUDED.quantity,
    amount_invested = EXCLUDED.amount_invested,
    last_updated = CURRENT_TIMESTAMP;


-- =========================================================
-- ORDERS
-- Uses order_type_enum and order_status_type
-- =========================================================

WITH order_seed(
    username,
    nickname,
    ticker,
    quantity,
    stock_price,
    order_type,
    status
) AS (
    VALUES
        ('johnsmith', 'John Main',        'AAPL',  10.0000::numeric, 190.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type),
        ('johnsmith', 'John Main',        'MSFT',   5.0000::numeric, 420.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type),
        ('janedoe',   'Jane Trading',     'NVDA',   2.0000::numeric, 930.00::numeric, 'buy'::order_type_enum,  'accepted'::order_status_type),
        ('janedoe',   'Jane Trading',     'MSFT',  10.0000::numeric, 425.00::numeric, 'sell'::order_type_enum, 'placed'::order_status_type),
        ('mikebrown', 'Mike Growth',      'AMZN',  20.0000::numeric, 180.00::numeric, 'buy'::order_type_enum,  'pending'::order_status_type),
        ('mikebrown', 'Mike Growth',      'TSLA',  10.0000::numeric, 250.00::numeric, 'buy'::order_type_enum,  'canceled'::order_status_type),
        ('alicegreen','Alice Retirement', 'SPY',   15.0000::numeric, 515.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type),
        ('bobwilson', 'Bob Portfolio',    'GOOGL', 30.0000::numeric, 170.00::numeric, 'buy'::order_type_enum,  'rejected'::order_status_type)
)
INSERT INTO orders (
    account_id,
    instrument_id,
    quantity,
    stock_price,
    order_type,
    status
)
SELECT
    a.account_id,
    i.instrument_id,
    s.quantity,
    s.stock_price,
    s.order_type,
    s.status
FROM order_seed s
JOIN users u
    ON u.username = s.username
JOIN accounts a
    ON a.user_id = u.user_id
   AND a.nickname IS NOT DISTINCT FROM s.nickname
JOIN instruments i
    ON i.ticker = s.ticker
WHERE NOT EXISTS (
    SELECT 1
    FROM orders o
    WHERE o.account_id = a.account_id
      AND o.instrument_id = i.instrument_id
      AND o.quantity = s.quantity
      AND o.stock_price IS NOT DISTINCT FROM s.stock_price
      AND o.order_type = s.order_type
      AND o.status = s.status
);


-- =========================================================
-- ORDER STATUS HISTORY
--
-- changed_at is supplied explicitly because the primary key
-- is (order_id, changed_at). CURRENT_TIMESTAMP has one stable
-- value throughout the transaction.
-- =========================================================

WITH order_seed(
    order_key,
    username,
    nickname,
    ticker,
    quantity,
    stock_price,
    order_type,
    status
) AS (
    VALUES
        ('o1', 'johnsmith', 'John Main',        'AAPL',  10.0000::numeric, 190.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type),
        ('o2', 'johnsmith', 'John Main',        'MSFT',   5.0000::numeric, 420.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type),
        ('o3', 'janedoe',   'Jane Trading',     'NVDA',   2.0000::numeric, 930.00::numeric, 'buy'::order_type_enum,  'accepted'::order_status_type),
        ('o4', 'janedoe',   'Jane Trading',     'MSFT',  10.0000::numeric, 425.00::numeric, 'sell'::order_type_enum, 'placed'::order_status_type),
        ('o5', 'mikebrown', 'Mike Growth',      'AMZN',  20.0000::numeric, 180.00::numeric, 'buy'::order_type_enum,  'pending'::order_status_type),
        ('o6', 'mikebrown', 'Mike Growth',      'TSLA',  10.0000::numeric, 250.00::numeric, 'buy'::order_type_enum,  'canceled'::order_status_type),
        ('o7', 'alicegreen','Alice Retirement', 'SPY',   15.0000::numeric, 515.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type),
        ('o8', 'bobwilson', 'Bob Portfolio',    'GOOGL', 30.0000::numeric, 170.00::numeric, 'buy'::order_type_enum,  'rejected'::order_status_type)
),
order_map AS (
    SELECT
        s.order_key,
        (
            SELECT MIN(o.order_id)
            FROM orders o
            JOIN accounts a
                ON a.account_id = o.account_id
            JOIN users u
                ON u.user_id = a.user_id
            JOIN instruments i
                ON i.instrument_id = o.instrument_id
            WHERE u.username = s.username
              AND a.nickname IS NOT DISTINCT FROM s.nickname
              AND i.ticker = s.ticker
              AND o.quantity = s.quantity
              AND o.stock_price IS NOT DISTINCT FROM s.stock_price
              AND o.order_type = s.order_type
              AND o.status = s.status
        ) AS order_id
    FROM order_seed s
),
status_seed(
    order_key,
    transition_number,
    old_status,
    new_status
) AS (
    VALUES
        ('o1', 1, NULL::order_status_type,       'created'::order_status_type),
        ('o1', 2, 'created'::order_status_type,  'accepted'::order_status_type),
        ('o1', 3, 'accepted'::order_status_type, 'filled'::order_status_type),

        ('o2', 1, NULL::order_status_type,       'created'::order_status_type),
        ('o2', 2, 'created'::order_status_type,  'accepted'::order_status_type),
        ('o2', 3, 'accepted'::order_status_type, 'filled'::order_status_type),

        ('o3', 1, NULL::order_status_type,       'created'::order_status_type),
        ('o3', 2, 'created'::order_status_type,  'accepted'::order_status_type),

        ('o4', 1, NULL::order_status_type,       'created'::order_status_type),
        ('o4', 2, 'created'::order_status_type,  'placed'::order_status_type),

        ('o5', 1, NULL::order_status_type,       'created'::order_status_type),
        ('o5', 2, 'created'::order_status_type,  'pending'::order_status_type),

        ('o6', 1, NULL::order_status_type,       'created'::order_status_type),
        ('o6', 2, 'created'::order_status_type,  'canceled'::order_status_type),

        ('o7', 1, NULL::order_status_type,       'created'::order_status_type),
        ('o7', 2, 'created'::order_status_type,  'accepted'::order_status_type),
        ('o7', 3, 'accepted'::order_status_type, 'filled'::order_status_type),

        ('o8', 1, NULL::order_status_type,       'created'::order_status_type),
        ('o8', 2, 'created'::order_status_type,  'rejected'::order_status_type)
),
history_seed AS (
    SELECT
        om.order_id,
        ss.old_status,
        ss.new_status,

        -- One stable timestamp per order and transition number.
        TIMESTAMP '2026-01-01 00:00:00'
            + om.order_id * INTERVAL '1 day'
            + ss.transition_number * INTERVAL '1 second'
            AS changed_at
    FROM status_seed ss
    JOIN order_map om
        ON om.order_key = ss.order_key
    WHERE om.order_id IS NOT NULL
)
INSERT INTO order_status_history (
    order_id,
    changed_at,
    old_status,
    new_status
)
SELECT
    hs.order_id,
    hs.changed_at,
    hs.old_status,
    hs.new_status
FROM history_seed hs
WHERE NOT EXISTS (
    SELECT 1
    FROM order_status_history h
    WHERE h.order_id = hs.order_id
      AND h.old_status IS NOT DISTINCT FROM hs.old_status
      AND h.new_status = hs.new_status
);


-- =========================================================
-- ACCOUNT TRANSACTIONS
-- Uses transaction_type enum
-- =========================================================

WITH order_seed(
    order_key,
    username,
    nickname,
    ticker,
    quantity,
    stock_price,
    order_type,
    status
) AS (
    VALUES
        ('o1', 'johnsmith', 'John Main',        'AAPL', 10.0000::numeric, 190.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type),
        ('o2', 'johnsmith', 'John Main',        'MSFT',  5.0000::numeric, 420.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type),
        ('o3', 'janedoe',   'Jane Trading',     'NVDA',  2.0000::numeric, 930.00::numeric, 'buy'::order_type_enum,  'accepted'::order_status_type),
        ('o4', 'janedoe',   'Jane Trading',     'MSFT', 10.0000::numeric, 425.00::numeric, 'sell'::order_type_enum, 'placed'::order_status_type),
        ('o5', 'mikebrown', 'Mike Growth',      'AMZN', 20.0000::numeric, 180.00::numeric, 'buy'::order_type_enum,  'pending'::order_status_type),
        ('o7', 'alicegreen','Alice Retirement', 'SPY',  15.0000::numeric, 515.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type)
),
order_map AS (
    SELECT
        s.order_key,
        (
            SELECT MIN(o.order_id)
            FROM orders o
            JOIN accounts a
                ON a.account_id = o.account_id
            JOIN users u
                ON u.user_id = a.user_id
            JOIN instruments i
                ON i.instrument_id = o.instrument_id
            WHERE u.username = s.username
              AND a.nickname IS NOT DISTINCT FROM s.nickname
              AND i.ticker = s.ticker
              AND o.quantity = s.quantity
              AND o.stock_price IS NOT DISTINCT FROM s.stock_price
              AND o.order_type = s.order_type
              AND o.status = s.status
        ) AS order_id
    FROM order_seed s
),
transaction_seed(
    username,
    nickname,
    order_key,
    amount,
    transaction_kind
) AS (
    VALUES
        ('johnsmith', 'John Main',        'o1', 1900.00::numeric,  'buy'::transaction_type),
        ('johnsmith', 'John Main',        'o2', 2100.00::numeric,  'buy'::transaction_type),
        ('janedoe',   'Jane Trading',     'o3', 1860.00::numeric,  'buy'::transaction_type),
        ('janedoe',   'Jane Trading',     'o4', 4250.00::numeric,  'sell'::transaction_type),
        ('mikebrown', 'Mike Growth',      'o5', 3600.00::numeric,  'buy'::transaction_type),
        ('alicegreen','Alice Retirement', 'o7', 7725.00::numeric,  'buy'::transaction_type),
        ('johnsmith', 'John Main',        NULL, 10000.00::numeric, 'deposit'::transaction_type),
        ('janedoe',   'Jane Trading',     NULL, 20000.00::numeric, 'deposit'::transaction_type),
        ('mikebrown', 'Mike Growth',      NULL, 5000.00::numeric,  'deposit'::transaction_type),
        ('bobwilson', 'Bob Portfolio',    NULL, 1000.00::numeric,  'withdraw'::transaction_type)
)
INSERT INTO account_transactions (
    account_id,
    order_id,
    amount,
    transaction_type
)
SELECT
    a.account_id,
    om.order_id,
    ts.amount,
    ts.transaction_kind
FROM transaction_seed ts
JOIN users u
    ON u.username = ts.username
JOIN accounts a
    ON a.user_id = u.user_id
   AND a.nickname IS NOT DISTINCT FROM ts.nickname
LEFT JOIN order_map om
    ON om.order_key = ts.order_key
WHERE NOT EXISTS (
    SELECT 1
    FROM account_transactions atx
    WHERE atx.account_id = a.account_id
      AND atx.order_id IS NOT DISTINCT FROM om.order_id
      AND atx.amount = ts.amount
      AND atx.transaction_type = ts.transaction_kind
);


-- =========================================================
-- USER LOGS
-- Uses log_status_type enum
-- =========================================================

WITH user_log_seed(
    username,
    ip_address,
    event,
    log_status
) AS (
    VALUES
        ('johnsmith', '192.168.1.10', 'LOGIN',           'success'::log_status_type),
        ('janedoe',   '192.168.1.11', 'LOGIN',           'success'::log_status_type),
        ('mikebrown', '192.168.1.12', 'LOGIN',           'success'::log_status_type),
        ('alicegreen','192.168.1.13', 'PASSWORD_CHANGE', 'success'::log_status_type),
        ('bobwilson', '192.168.1.14', 'LOGIN',           'failure'::log_status_type),
        ('admin1',    '192.168.1.1',  'CREATE_USER',     'success'::log_status_type)
)
INSERT INTO user_logs (
    user_id,
    username,
    ip_address,
    event,
    status
)
SELECT
    u.user_id,
    u.username,
    s.ip_address,
    s.event,
    s.log_status
FROM user_log_seed s
JOIN users u
    ON u.username = s.username
WHERE NOT EXISTS (
    SELECT 1
    FROM user_logs ul
    WHERE ul.user_id = u.user_id
      AND ul.username = u.username
      AND ul.ip_address IS NOT DISTINCT FROM s.ip_address
      AND ul.event = s.event
      AND ul.status IS NOT DISTINCT FROM s.log_status
);


-- =========================================================
-- TRANSACTION LOGS
-- Uses log_status_type enum
-- =========================================================

WITH order_seed(
    order_key,
    username,
    nickname,
    ticker,
    quantity,
    stock_price,
    order_type,
    status
) AS (
    VALUES
        ('o1', 'johnsmith', 'John Main',        'AAPL', 10.0000::numeric, 190.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type),
        ('o2', 'johnsmith', 'John Main',        'MSFT',  5.0000::numeric, 420.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type),
        ('o3', 'janedoe',   'Jane Trading',     'NVDA',  2.0000::numeric, 930.00::numeric, 'buy'::order_type_enum,  'accepted'::order_status_type),
        ('o4', 'janedoe',   'Jane Trading',     'MSFT', 10.0000::numeric, 425.00::numeric, 'sell'::order_type_enum, 'placed'::order_status_type),
        ('o5', 'mikebrown', 'Mike Growth',      'AMZN', 20.0000::numeric, 180.00::numeric, 'buy'::order_type_enum,  'pending'::order_status_type),
        ('o7', 'alicegreen','Alice Retirement', 'SPY',  15.0000::numeric, 515.00::numeric, 'buy'::order_type_enum,  'filled'::order_status_type)
),
order_map AS (
    SELECT
        s.order_key,
        (
            SELECT MIN(o.order_id)
            FROM orders o
            JOIN accounts a
                ON a.account_id = o.account_id
            JOIN users u
                ON u.user_id = a.user_id
            JOIN instruments i
                ON i.instrument_id = o.instrument_id
            WHERE u.username = s.username
              AND a.nickname IS NOT DISTINCT FROM s.nickname
              AND i.ticker = s.ticker
              AND o.quantity = s.quantity
              AND o.stock_price IS NOT DISTINCT FROM s.stock_price
              AND o.order_type = s.order_type
              AND o.status = s.status
        ) AS order_id
    FROM order_seed s
),
transaction_seed(
    username,
    nickname,
    order_key,
    amount,
    transaction_kind
) AS (
    VALUES
        ('johnsmith', 'John Main',        'o1', 1900.00::numeric, 'buy'::transaction_type),
        ('johnsmith', 'John Main',        'o2', 2100.00::numeric, 'buy'::transaction_type),
        ('janedoe',   'Jane Trading',     'o3', 1860.00::numeric, 'buy'::transaction_type),
        ('janedoe',   'Jane Trading',     'o4', 4250.00::numeric, 'sell'::transaction_type),
        ('mikebrown', 'Mike Growth',      'o5', 3600.00::numeric, 'buy'::transaction_type),
        ('alicegreen','Alice Retirement', 'o7', 7725.00::numeric, 'buy'::transaction_type)
),
transaction_map AS (
    SELECT
        ts.username,
        ts.nickname,
        ts.order_key,
        ts.amount,
        ts.transaction_kind,
        (
            SELECT MIN(atx.transaction_id)
            FROM account_transactions atx
            JOIN accounts a
                ON a.account_id = atx.account_id
            JOIN users u
                ON u.user_id = a.user_id
            LEFT JOIN order_map om2
                ON om2.order_key = ts.order_key
            WHERE u.username = ts.username
              AND a.nickname IS NOT DISTINCT FROM ts.nickname
              AND atx.order_id IS NOT DISTINCT FROM om2.order_id
              AND atx.amount = ts.amount
              AND atx.transaction_type = ts.transaction_kind
        ) AS transaction_id
    FROM transaction_seed ts
),
transaction_log_seed(
    username,
    nickname,
    order_key,
    event,
    amount,
    log_status
) AS (
    VALUES
        ('johnsmith', 'John Main',        'o1', 'ORDER_FILLED',   1900.00::numeric, 'success'::log_status_type),
        ('johnsmith', 'John Main',        'o2', 'ORDER_FILLED',   2100.00::numeric, 'success'::log_status_type),
        ('janedoe',   'Jane Trading',     'o3', 'ORDER_ACCEPTED', 1860.00::numeric, 'success'::log_status_type),
        ('janedoe',   'Jane Trading',     'o4', 'ORDER_PLACED',  4250.00::numeric, 'success'::log_status_type),
        ('mikebrown', 'Mike Growth',      'o5', 'ORDER_PENDING',  3600.00::numeric, 'failure'::log_status_type),
        ('alicegreen','Alice Retirement', 'o7', 'ORDER_FILLED',   7725.00::numeric, 'success'::log_status_type)
)
INSERT INTO transaction_logs (
    user_id,
    account_id,
    event,
    amount,
    transaction_id,
    order_id,
    status
)
SELECT
    u.user_id,
    a.account_id,
    tls.event,
    tls.amount,
    tm.transaction_id,
    om.order_id,
    tls.log_status
FROM transaction_log_seed tls
JOIN users u
    ON u.username = tls.username
JOIN accounts a
    ON a.user_id = u.user_id
   AND a.nickname IS NOT DISTINCT FROM tls.nickname
LEFT JOIN order_map om
    ON om.order_key = tls.order_key
LEFT JOIN transaction_map tm
    ON tm.username = tls.username
   AND tm.nickname IS NOT DISTINCT FROM tls.nickname
   AND tm.order_key IS NOT DISTINCT FROM tls.order_key
   AND tm.amount = tls.amount
WHERE NOT EXISTS (
    SELECT 1
    FROM transaction_logs tl
    WHERE tl.user_id = u.user_id
      AND tl.account_id = a.account_id
      AND tl.event = tls.event
      AND tl.amount IS NOT DISTINCT FROM tls.amount
      AND tl.transaction_id IS NOT DISTINCT FROM tm.transaction_id
      AND tl.order_id IS NOT DISTINCT FROM om.order_id
      AND tl.status IS NOT DISTINCT FROM tls.log_status
);

-- =========================================================
-- 100 ADDITIONAL HISTORICAL TRANSACTIONS
--
-- Creates:
--   100 orders
--   300 order status history records
--   100 account transactions
--   100 transaction logs
--
-- Date range:
--   2024-01-15 through 2026-10-01
--
-- Add this block after the existing TRANSACTION LOGS block
-- and before the REFRESH TOKENS block.
-- =========================================================


-- ---------------------------------------------------------
-- Build the deterministic bulk seed
-- ---------------------------------------------------------

CREATE TEMP TABLE bulk_transaction_seed (
    seed_number       INT PRIMARY KEY,
    username          TEXT NOT NULL,
    nickname          TEXT NOT NULL,
    ticker            TEXT NOT NULL,
    quantity          NUMERIC(17, 4) NOT NULL,
    stock_price       NUMERIC(15, 2) NOT NULL,
    order_kind        order_type_enum NOT NULL,
    order_status      order_status_type NOT NULL,
    transaction_kind  transaction_type NOT NULL,
    amount             NUMERIC(15, 2) NOT NULL,
    occurred_at        TIMESTAMP NOT NULL
) ON COMMIT DROP;


INSERT INTO bulk_transaction_seed (
    seed_number,
    username,
    nickname,
    ticker,
    quantity,
    stock_price,
    order_kind,
    order_status,
    transaction_kind,
    amount,
    occurred_at
)
SELECT
    generated.seed_number,
    generated.username,
    generated.nickname,
    generated.ticker,
    generated.quantity,
    generated.stock_price,
    generated.order_kind,
    'filled'::order_status_type,
    generated.order_kind::text::transaction_type,
    ROUND(
        generated.quantity * generated.stock_price,
        2
    ) AS amount,

    -- 100 records spread over approximately 33 months.
    TIMESTAMP '2024-01-15 09:00:00'
        + ((generated.seed_number - 1) * INTERVAL '10 days')
        + ((generated.seed_number % 8) * INTERVAL '1 hour')
        + ((generated.seed_number % 45) * INTERVAL '1 minute')
        AS occurred_at
FROM (
    SELECT
        series.seed_number,

        CASE ((series.seed_number - 1) % 5)
            WHEN 0 THEN 'johnsmith'
            WHEN 1 THEN 'janedoe'
            WHEN 2 THEN 'mikebrown'
            WHEN 3 THEN 'alicegreen'
            ELSE 'bobwilson'
        END AS username,

        CASE ((series.seed_number - 1) % 5)
            WHEN 0 THEN 'John Main'
            WHEN 1 THEN 'Jane Trading'
            WHEN 2 THEN 'Mike Growth'
            WHEN 3 THEN 'Alice Retirement'
            ELSE 'Bob Portfolio'
        END AS nickname,

        CASE ((series.seed_number - 1) % 8)
            WHEN 0 THEN 'AAPL'
            WHEN 1 THEN 'MSFT'
            WHEN 2 THEN 'GOOGL'
            WHEN 3 THEN 'AMZN'
            WHEN 4 THEN 'TSLA'
            WHEN 5 THEN 'NVDA'
            WHEN 6 THEN 'META'
            ELSE 'SPY'
        END AS ticker,

        -- A deterministic quantity between 2 and 21.
        (
            1 + ((series.seed_number - 1) % 20) + 1
        )::numeric(17, 4) AS quantity,

        -- A unique deterministic price for each seed number.
        ROUND(
            CASE ((series.seed_number - 1) % 8)
                WHEN 0 THEN 175.00
                WHEN 1 THEN 390.00
                WHEN 2 THEN 145.00
                WHEN 3 THEN 160.00
                WHEN 4 THEN 210.00
                WHEN 5 THEN 700.00
                WHEN 6 THEN 430.00
                ELSE 480.00
            END
            + (series.seed_number * 0.13),
            2
        )::numeric(15, 2) AS stock_price,

        CASE
            WHEN series.seed_number % 3 = 0
                THEN 'sell'::order_type_enum
            ELSE 'buy'::order_type_enum
        END AS order_kind

    FROM generate_series(1, 100) AS series(seed_number)
) generated;


-- ---------------------------------------------------------
-- Insert 100 additional orders
-- ---------------------------------------------------------

INSERT INTO orders (
    account_id,
    instrument_id,
    quantity,
    stock_price,
    order_type,
    status
)
SELECT
    a.account_id,
    i.instrument_id,
    seed.quantity,
    seed.stock_price,
    seed.order_kind,
    seed.order_status
FROM bulk_transaction_seed seed
JOIN users u
    ON u.username = seed.username
JOIN accounts a
    ON a.user_id = u.user_id
   AND a.nickname IS NOT DISTINCT FROM seed.nickname
JOIN instruments i
    ON i.ticker = seed.ticker
WHERE NOT EXISTS (
    SELECT 1
    FROM orders existing_order
    WHERE existing_order.account_id = a.account_id
      AND existing_order.instrument_id = i.instrument_id
      AND existing_order.quantity = seed.quantity
      AND existing_order.stock_price IS NOT DISTINCT FROM seed.stock_price
      AND existing_order.order_type = seed.order_kind
      AND existing_order.status = seed.order_status
);


-- ---------------------------------------------------------
-- Map every generated seed record to its order_id
-- ---------------------------------------------------------

CREATE TEMP TABLE bulk_order_map (
    seed_number  INT PRIMARY KEY,
    order_id     INT NOT NULL,
    account_id   INT NOT NULL,
    user_id      INT NOT NULL
) ON COMMIT DROP;


INSERT INTO bulk_order_map (
    seed_number,
    order_id,
    account_id,
    user_id
)
SELECT
    seed.seed_number,
    MIN(o.order_id) AS order_id,
    a.account_id,
    u.user_id
FROM bulk_transaction_seed seed
JOIN users u
    ON u.username = seed.username
JOIN accounts a
    ON a.user_id = u.user_id
   AND a.nickname IS NOT DISTINCT FROM seed.nickname
JOIN instruments i
    ON i.ticker = seed.ticker
JOIN orders o
    ON o.account_id = a.account_id
   AND o.instrument_id = i.instrument_id
   AND o.quantity = seed.quantity
   AND o.stock_price IS NOT DISTINCT FROM seed.stock_price
   AND o.order_type = seed.order_kind
   AND o.status = seed.order_status
GROUP BY
    seed.seed_number,
    a.account_id,
    u.user_id;


-- ---------------------------------------------------------
-- Add status history for all 100 orders
--
-- Each order has:
--   created  -> two days before transaction
--   accepted -> one day before transaction
--   filled   -> transaction time
-- ---------------------------------------------------------

WITH generated_history AS (
    SELECT
        map.order_id,
        seed.seed_number,
        history.transition_number,
        history.old_status,
        history.new_status,

        CASE history.transition_number
            WHEN 1 THEN seed.occurred_at - INTERVAL '2 days'
            WHEN 2 THEN seed.occurred_at - INTERVAL '1 day'
            ELSE seed.occurred_at
        END AS changed_at

    FROM bulk_transaction_seed seed
    JOIN bulk_order_map map
        ON map.seed_number = seed.seed_number
    CROSS JOIN LATERAL (
        VALUES
            (
                1,
                NULL::order_status_type,
                'created'::order_status_type
            ),
            (
                2,
                'created'::order_status_type,
                'accepted'::order_status_type
            ),
            (
                3,
                'accepted'::order_status_type,
                'filled'::order_status_type
            )
    ) AS history(
        transition_number,
        old_status,
        new_status
    )
)
INSERT INTO order_status_history (
    order_id,
    changed_at,
    old_status,
    new_status
)
SELECT
    generated.order_id,
    generated.changed_at,
    generated.old_status,
    generated.new_status
FROM generated_history generated
WHERE NOT EXISTS (
    SELECT 1
    FROM order_status_history existing_history
    WHERE existing_history.order_id = generated.order_id
      AND existing_history.old_status
            IS NOT DISTINCT FROM generated.old_status
      AND existing_history.new_status = generated.new_status
);


-- ---------------------------------------------------------
-- Insert 100 account transactions
-- ---------------------------------------------------------

INSERT INTO account_transactions (
    account_id,
    order_id,
    amount,
    transaction_type,
    created_at
)
SELECT
    map.account_id,
    map.order_id,
    seed.amount,
    seed.transaction_kind,
    seed.occurred_at
FROM bulk_transaction_seed seed
JOIN bulk_order_map map
    ON map.seed_number = seed.seed_number
WHERE NOT EXISTS (
    SELECT 1
    FROM account_transactions existing_transaction
    WHERE existing_transaction.account_id = map.account_id
      AND existing_transaction.order_id = map.order_id
      AND existing_transaction.amount = seed.amount
      AND existing_transaction.transaction_type = seed.transaction_kind
);


-- ---------------------------------------------------------
-- Map generated transactions to their transaction_id
-- ---------------------------------------------------------

CREATE TEMP TABLE bulk_account_transaction_map (
    seed_number     INT PRIMARY KEY,
    transaction_id INT NOT NULL
) ON COMMIT DROP;


INSERT INTO bulk_account_transaction_map (
    seed_number,
    transaction_id
)
SELECT
    seed.seed_number,
    MIN(atx.transaction_id) AS transaction_id
FROM bulk_transaction_seed seed
JOIN bulk_order_map map
    ON map.seed_number = seed.seed_number
JOIN account_transactions atx
    ON atx.account_id = map.account_id
   AND atx.order_id = map.order_id
   AND atx.amount = seed.amount
   AND atx.transaction_type = seed.transaction_kind
GROUP BY seed.seed_number;


-- ---------------------------------------------------------
-- Insert 100 transaction audit logs
--
-- The Angular component expects ORDER_FILLED rather than
-- BUY_ORDER_FILLED or SELL_ORDER_FILLED.
-- ---------------------------------------------------------

INSERT INTO transaction_logs (
    user_id,
    account_id,
    event,
    amount,
    transaction_id,
    order_id,
    status,
    happened_at
)
SELECT
    map.user_id,
    map.account_id,
    'ORDER_FILLED',
    seed.amount,
    transaction_map.transaction_id,
    map.order_id,
    'success'::log_status_type,
    seed.occurred_at
FROM bulk_transaction_seed seed
JOIN bulk_order_map map
    ON map.seed_number = seed.seed_number
JOIN bulk_account_transaction_map transaction_map
    ON transaction_map.seed_number = seed.seed_number
WHERE NOT EXISTS (
    SELECT 1
    FROM transaction_logs existing_log
    WHERE existing_log.user_id = map.user_id
      AND existing_log.account_id = map.account_id
      AND existing_log.event = 'ORDER_FILLED'
      AND existing_log.amount IS NOT DISTINCT FROM seed.amount
      AND existing_log.transaction_id
            IS NOT DISTINCT FROM transaction_map.transaction_id
      AND existing_log.order_id IS NOT DISTINCT FROM map.order_id
      AND existing_log.status
            IS NOT DISTINCT FROM 'success'::log_status_type
);


-- =========================================================
-- REFRESH TOKENS
-- Upsert by unique user_id
-- =========================================================

WITH token_seed(
    username,
    refresh_token,
    expires_at
) AS (
    VALUES
        ('johnsmith', 'rtoken1',   CURRENT_TIMESTAMP + INTERVAL '30 days'),
        ('janedoe',   'rtoken2',   CURRENT_TIMESTAMP + INTERVAL '30 days'),
        ('mikebrown', 'rtoken3',   CURRENT_TIMESTAMP + INTERVAL '30 days'),
        ('alicegreen','rtoken4',   CURRENT_TIMESTAMP + INTERVAL '30 days'),
        ('bobwilson', 'rtoken5',   CURRENT_TIMESTAMP + INTERVAL '30 days'),
        ('admin1',    'admintoken', CURRENT_TIMESTAMP + INTERVAL '30 days')
)
INSERT INTO refresh_tokens (
    user_id,
    refresh_token,
    expires_at
)
SELECT
    u.user_id,
    s.refresh_token,
    s.expires_at
FROM token_seed s
JOIN users u
    ON u.username = s.username
ON CONFLICT (user_id) DO UPDATE
SET
    refresh_token = EXCLUDED.refresh_token,
    expires_at = EXCLUDED.expires_at;

COMMIT;
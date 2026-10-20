-- Run this after schema creation and after db/instruments_inserts.sql
-- This script seeds varied data for all users with consistent order lifecycle/history.

INSERT INTO users (user_id, username, email, created_at, phone_number, last_login, reward_points, date_of_birth) VALUES
    (1, 'alice_ng', 'alice.ng@example.com', '2026-10-01 08:00:00', '+1-202-555-0101', '2026-10-18 16:40:00', 120, '1991-04-12'),
    (2, 'bob_khan', 'bob.khan@example.com', '2026-10-01 08:05:00', '+1-202-555-0102', '2026-10-18 16:10:00', 95, '1988-09-03'),
    (3, 'carla_ross', 'carla.ross@example.com', '2026-10-01 08:10:00', '+1-202-555-0103', '2026-10-18 15:55:00', 140, '1994-01-22'),
    (4, 'devin_cho', 'devin.cho@example.com', '2026-10-01 08:15:00', '+1-202-555-0104', '2026-10-18 15:30:00', 80, '1986-06-18'),
    (5, 'emma_li', 'emma.li@example.com', '2026-10-01 08:20:00', '+1-202-555-0105', '2026-10-18 15:20:00', 60, '1996-11-27'),
    (6, 'admin', 'admin@example.com', '2026-10-01 08:25:00', '+1-202-555-0106', '2026-10-18 15:05:00', 110, '1990-02-14');

INSERT INTO accounts (account_id, user_id, nickname, cash_balance, created_at) VALUES
    (1, 1, 'Primary Growth', 15420.00, '2026-10-01 09:00:00'),
    (2, 1, 'Income Sleeve', 8420.00, '2026-10-01 09:05:00'),
    (3, 2, 'Core Portfolio', 11200.00, '2026-10-01 09:10:00'),
    (4, 3, 'Momentum', 6650.00, '2026-10-01 09:15:00'),
    (5, 4, 'Retirement', 20350.00, '2026-10-01 09:20:00'),
    (6, 5, 'Speculative', 3900.00, '2026-10-01 09:25:00'),
    (7, 5, 'Dividend', 9750.00, '2026-10-01 09:30:00'),
    (8, 2, 'Trading', 4800.00, '2026-10-01 09:35:00');

INSERT INTO portfolio_snapshots (snapshot_id, account_id, total_value, created_at) VALUES
    (1, 1, 32540.25, '2026-10-18 16:00:00'),
    (9, 1, 401234.00, '2026-10-19 16:00:00'),
    (10, 1, 452345.00, '2026-10-20 16:00:00'),
    (11, 1, 503456.00, '2026-10-21 16:00:00'),
    (12, 1, 493456.00, '2026-10-22 16:00:00'),
    (13, 1, 503789.00, '2026-10-23 16:00:00'),
    (14, 1, 513456.00, '2026-10-24 16:00:00'),
    (2, 2, 14310.00, '2026-10-18 16:00:00'),
    (3, 3, 28775.80, '2026-10-18 16:00:00'),
    (4, 4, 12110.60, '2026-10-18 16:00:00'),
    (5, 5, 41550.30, '2026-10-18 16:00:00'),
    (6, 6, 8125.45, '2026-10-18 16:00:00'),
    (7, 5, 17380.90, '2026-10-18 16:00:00'),
    (8, 2, 9780.40, '2026-10-18 16:00:00');

INSERT INTO account_holdings (account_id, instrument_id, quantity, amount_invested, last_updated) VALUES
    (1, (SELECT instrument_id FROM instruments WHERE ticker = 'AAPL'), 25.5000, 5200.00, '2026-10-18 15:00:00'),
    (1, (SELECT instrument_id FROM instruments WHERE ticker = 'MSFT'), 10.0000, 3950.00, '2026-10-18 15:00:00'),
    (2, (SELECT instrument_id FROM instruments WHERE ticker = 'JNJ'), 18.0000, 2950.00, '2026-10-18 15:00:00'),
    (2, (SELECT instrument_id FROM instruments WHERE ticker = 'PG'), 22.0000, 3300.00, '2026-10-18 15:00:00'),
    (3, (SELECT instrument_id FROM instruments WHERE ticker = 'AMZN'), 12.0000, 2100.00, '2026-10-18 15:00:00'),
    (3, (SELECT instrument_id FROM instruments WHERE ticker = 'GOOGL'), 7.5000, 1400.00, '2026-10-18 15:00:00'),
    (4, (SELECT instrument_id FROM instruments WHERE ticker = 'NVDA'), 6.0000, 4850.00, '2026-10-18 15:00:00'),
    (4, (SELECT instrument_id FROM instruments WHERE ticker = 'TSLA'), 9.0000, 2350.00, '2026-10-18 15:00:00'),
    (5, (SELECT instrument_id FROM instruments WHERE ticker = 'JPM'), 30.0000, 5700.00, '2026-10-18 15:00:00'),
    (5, (SELECT instrument_id FROM instruments WHERE ticker = 'WMT'), 25.0000, 1700.00, '2026-10-18 15:00:00'),
    (6, (SELECT instrument_id FROM instruments WHERE ticker = 'AMD'), 40.0000, 4300.00, '2026-10-18 15:00:00'),
    (6, (SELECT instrument_id FROM instruments WHERE ticker = 'NFLX'), 4.0000, 1950.00, '2026-10-18 15:00:00'),
    (7, (SELECT instrument_id FROM instruments WHERE ticker = 'KO'), 55.0000, 3100.00, '2026-10-18 15:00:00'),
    (7, (SELECT instrument_id FROM instruments WHERE ticker = 'PEP'), 20.0000, 3250.00, '2026-10-18 15:00:00'),
    (8, (SELECT instrument_id FROM instruments WHERE ticker = 'META'), 5.0000, 2400.00, '2026-10-18 15:00:00'),
    (8, (SELECT instrument_id FROM instruments WHERE ticker = 'AVGO'), 3.0000, 1750.00, '2026-10-18 15:00:00');

-- Orders store the most recent status only.
INSERT INTO orders (order_id, account_id, instrument_id, quantity, stock_price, order_type, status) VALUES
    (1, 1, (SELECT instrument_id FROM instruments WHERE ticker = 'AAPL'), 10.0000, 190.00, 'buy', 'filled'),
    (2, 1, (SELECT instrument_id FROM instruments WHERE ticker = 'MSFT'), 5.0000, 410.00, 'sell', 'filled'),
    (3, 2, (SELECT instrument_id FROM instruments WHERE ticker = 'PG'), 20.0000, 155.00, 'buy', 'rejected'),
    (4, 3, (SELECT instrument_id FROM instruments WHERE ticker = 'AMZN'), 4.0000, 175.00, 'buy', 'filled'),
    (5, 4, (SELECT instrument_id FROM instruments WHERE ticker = 'TSLA'), 8.0000, 245.00, 'buy', 'rejected'),
    (6, 5, (SELECT instrument_id FROM instruments WHERE ticker = 'JPM'), 12.0000, 198.00, 'sell', 'filled'),
    (7, 6, (SELECT instrument_id FROM instruments WHERE ticker = 'AMD'), 15.0000, 118.00, 'buy', 'filled'),
    (8, 7, (SELECT instrument_id FROM instruments WHERE ticker = 'KO'), 30.0000, 63.00, 'sell', 'filled'),
    (9, 8, (SELECT instrument_id FROM instruments WHERE ticker = 'META'), 6.0000, 525.00, 'buy', 'rejected'),
    (10, 3, (SELECT instrument_id FROM instruments WHERE ticker = 'GOOGL'), 3.0000, 172.00, 'sell', 'filled'),
    (11, 5, (SELECT instrument_id FROM instruments WHERE ticker = 'WMT'), 10.0000, 70.00, 'buy', 'filled'),
    (12, 4, (SELECT instrument_id FROM instruments WHERE ticker = 'NVDA'), 2.0000, 890.00, 'sell', 'filled');

INSERT INTO order_status_history (order_id, changed_at, old_status, new_status) VALUES
    (1, '2026-10-10 09:00:00', NULL, 'placed'),
    (1, '2026-10-10 09:01:00', 'placed', 'accepted'),
    (1, '2026-10-10 09:03:00', 'accepted', 'filled'),
    (2, '2026-10-10 09:10:00', NULL, 'placed'),
    (2, '2026-10-10 09:11:00', 'placed', 'accepted'),
    (2, '2026-10-10 09:14:00', 'accepted', 'filled'),
    (3, '2026-10-10 09:20:00', NULL, 'placed'),
    (3, '2026-10-10 09:21:00', 'placed', 'rejected'),
    (4, '2026-10-10 09:30:00', NULL, 'placed'),
    (4, '2026-10-10 09:31:00', 'placed', 'accepted'),
    (4, '2026-10-10 09:33:00', 'accepted', 'filled'),
    (5, '2026-10-10 09:40:00', NULL, 'placed'),
    (5, '2026-10-10 09:41:00', 'placed', 'rejected'),
    (6, '2026-10-10 09:50:00', NULL, 'placed'),
    (6, '2026-10-10 09:51:00', 'placed', 'accepted'),
    (6, '2026-10-10 09:54:00', 'accepted', 'filled'),
    (7, '2026-10-10 10:00:00', NULL, 'placed'),
    (7, '2026-10-10 10:01:00', 'placed', 'accepted'),
    (7, '2026-10-10 10:03:00', 'accepted', 'filled'),
    (8, '2026-10-10 10:10:00', NULL, 'placed'),
    (8, '2026-10-10 10:11:00', 'placed', 'accepted'),
    (8, '2026-10-10 10:14:00', 'accepted', 'filled'),
    (9, '2026-10-10 10:20:00', NULL, 'placed'),
    (9, '2026-10-10 10:21:00', 'placed', 'rejected'),
    (10, '2026-10-10 10:30:00', NULL, 'placed'),
    (10, '2026-10-10 10:31:00', 'placed', 'accepted'),
    (10, '2026-10-10 10:34:00', 'accepted', 'filled'),
    (11, '2026-10-10 10:40:00', NULL, 'placed'),
    (11, '2026-10-10 10:41:00', 'placed', 'accepted'),
    (11, '2026-10-10 10:45:00', 'accepted', 'filled'),
    (12, '2026-10-10 10:50:00', NULL, 'placed'),
    (12, '2026-10-10 10:51:00', 'placed', 'accepted'),
    (12, '2026-10-10 10:54:00', 'accepted', 'filled');

INSERT INTO account_transactions (transaction_id, account_id, order_id, amount, transaction_type, created_at) VALUES
    (1, 1, NULL, 20000.00, 'deposit', '2026-10-02 09:00:00'),
    (2, 1, NULL, 1500.00, 'withdraw', '2026-10-03 09:10:00'),
    (3, 2, NULL, 9000.00, 'deposit', '2026-10-02 09:20:00'),
    (4, 3, NULL, 12000.00, 'deposit', '2026-10-02 09:30:00'),
    (5, 4, NULL, 7000.00, 'deposit', '2026-10-02 09:40:00'),
    (6, 5, NULL, 25000.00, 'deposit', '2026-10-02 09:50:00'),
    (7, 6, NULL, 5000.00, 'deposit', '2026-10-02 10:00:00'),
    (8, 7, NULL, 11000.00, 'deposit', '2026-10-02 10:10:00'),
    (9, 8, NULL, 6000.00, 'deposit', '2026-10-02 10:20:00'),
    (10, 1, 1, 1900.00, 'buy', '2026-10-10 09:04:00'),
    (11, 1, 2, 2050.00, 'sell', '2026-10-10 09:15:00'),
    (12, 3, 4, 700.00, 'buy', '2026-10-10 09:34:00'),
    (13, 5, 6, 2376.00, 'sell', '2026-10-10 09:55:00'),
    (14, 6, 7, 1770.00, 'buy', '2026-10-10 10:04:00'),
    (15, 7, 8, 1890.00, 'sell', '2026-10-10 10:15:00'),
    (16, 3, 10, 516.00, 'sell', '2026-10-10 10:35:00'),
    (17, 5, 11, 700.00, 'buy', '2026-10-10 10:46:00'),
    (18, 4, 12, 1780.00, 'sell', '2026-10-10 10:55:00'),
    (19, 8, NULL, 1000.00, 'withdraw', '2026-10-11 11:00:00');

INSERT INTO user_logs (log_id, user_id, username, ip_address, event, status, happened_at) VALUES
    (1, 1, 'alice_ng', '203.0.113.10', 'User login', 'success', '2026-10-18 16:40:00'),
    (2, 2, 'bob_khan', '203.0.113.11', 'User login', 'success', '2026-10-18 16:10:00'),
    (3, 3, 'carla_ross', '203.0.113.12', 'User login', 'success', '2026-10-18 15:55:00'),
    (4, 4, 'devin_cho', '203.0.113.13', 'User login', 'success', '2026-10-18 15:30:00'),
    (5, 5, 'emma_li', '203.0.113.14', 'User login', 'success', '2026-10-18 15:20:00'),
    (6, 6, 'frank_mora', '203.0.113.15', 'User login', 'success', '2026-10-18 15:05:00'),
    (7, 1, 'alice_ng', '203.0.113.10', 'Order 1 filled', 'success', '2026-10-10 09:03:30'),
    (8, 1, 'alice_ng', '203.0.113.10', 'Order 2 filled', 'success', '2026-10-10 09:14:30'),
    (9, 1, 'alice_ng', '203.0.113.10', 'Order 3 rejected', 'failure', '2026-10-10 09:21:30'),
    (10, 3, 'carla_ross', '203.0.113.12', 'Order 5 rejected', 'failure', '2026-10-10 09:41:30');

INSERT INTO transaction_logs (user_id, account_id, event, amount, transaction_id, order_id, status, happened_at)
SELECT
    a.user_id,
    t.account_id,
    CASE
        WHEN t.transaction_type = 'deposit' THEN 'Deposit posted'
        WHEN t.transaction_type = 'withdraw' THEN 'Withdrawal posted'
        WHEN t.transaction_type = 'buy' THEN 'Buy trade settled'
        WHEN t.transaction_type = 'sell' THEN 'Sell trade settled'
    END AS event,
    t.amount,
    t.transaction_id,
    t.order_id,
    'success'::log_status_type,
    t.created_at + INTERVAL '2 minutes'
FROM account_transactions t
JOIN accounts a ON a.account_id = t.account_id
WHERE t.transaction_id BETWEEN 1 AND 19;

-- Keep SERIAL sequences aligned with explicit IDs inserted above.
SELECT setval('users_user_id_seq', (SELECT COALESCE(MAX(user_id), 1) FROM users), true);
SELECT setval('accounts_account_id_seq', (SELECT COALESCE(MAX(account_id), 1) FROM accounts), true);
SELECT setval('portfolio_snapshots_snapshot_id_seq', (SELECT COALESCE(MAX(snapshot_id), 1) FROM portfolio_snapshots), true);
SELECT setval('orders_order_id_seq', (SELECT COALESCE(MAX(order_id), 1) FROM orders), true);
SELECT setval('account_transactions_transaction_id_seq', (SELECT COALESCE(MAX(transaction_id), 1) FROM account_transactions), true);
SELECT setval('user_logs_log_id_seq', (SELECT COALESCE(MAX(log_id), 1) FROM user_logs), true);
SELECT setval('transaction_logs_log_id_seq', (SELECT COALESCE(MAX(log_id), 1) FROM transaction_logs), true);

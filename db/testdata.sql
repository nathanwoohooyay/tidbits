-- Roles
INSERT INTO roles (name) VALUES 
('client'),
('auditor'),
('reporter'),
('admin');

-- Users (12 users)
INSERT INTO users (role_id, username, email, password_hash, phone_number, reward_points) VALUES
(1, 'john_investor', 'john@example.com', '$2b$12$hash1', '555-0101', 1500),
(1, 'sarah_trader', 'sarah@example.com', '$2b$12$hash2', '555-0102', 2300),
(1, 'mike_client', 'mike@example.com', '$2b$12$hash3', '555-0103', 850),
(1, 'lisa_portfolio', 'lisa@example.com', '$2b$12$hash4', '555-0104', 3200),
(1, 'david_investor', 'david@example.com', '$2b$12$hash5', '555-0105', 1900),
(2, 'auditor_alice', 'alice.audit@example.com', '$2b$12$hash6', '555-0201', 0),
(2, 'auditor_bob', 'bob.audit@example.com', '$2b$12$hash7', '555-0202', 0),
(3, 'reporter_carol', 'carol.report@example.com', '$2b$12$hash8', '555-0301', 0),
(4, 'admin_dave', 'dave.admin@example.com', '$2b$12$hash9', '555-0401', 0),
(1, 'emma_trader', 'emma@example.com', '$2b$12$hash10', '555-0106', 2700),
(1, 'frank_investor', 'frank@example.com', '$2b$12$hash11', '555-0107', 1100),
(1, 'grace_portfolio', 'grace@example.com', '$2b$12$hash12', '555-0108', 2500);

-- Accounts (15 accounts)
INSERT INTO accounts (user_id, nickname, cash_balance) VALUES
(1, 'Primary Brokerage', 50000.00),
(1, 'Retirement Fund', 150000.00),
(2, 'Trading Account', 75000.00),
(3, 'Investment Account', 25000.00),
(4, 'Main Portfolio', 200000.00),
(5, 'Growth Account', 100000.00),
(2, 'Savings Account', 50000.00),
(6, 'Audit Monitoring', 0.00),
(7, 'Audit Review', 0.00),
(8, 'Report Access', 0.00),
(10, 'Day Trading', 80000.00),
(11, 'Long Term', 120000.00),
(12, 'Conservative', 95000.00),
(3, 'Secondary Account', 35000.00),
(4, 'Emergency Fund', 15000.00);

-- Instruments (12 instruments)
INSERT INTO instruments (ticker, name, type, market) VALUES
('AAPL', 'Apple Inc.', 'stock', 'NASDAQ'),
('MSFT', 'Microsoft Corporation', 'stock', 'NASDAQ'),
('GOOGL', 'Alphabet Inc.', 'stock', 'NASDAQ'),
('TSLA', 'Tesla Inc.', 'stock', 'NASDAQ'),
('JPM', 'JPMorgan Chase', 'stock', 'NYSE'),
('US10Y', '10-Year Treasury Bond', 'bond', 'BOND'),
('VTSAX', 'Vanguard Total Stock', 'mutual_fund', 'MUTUAL_FUND'),
('SPY', 'SPDR S&P 500 ETF', 'etf', 'NYSE'),
('QQQ', 'Invesco QQQ Trust', 'etf', 'NASDAQ'),
('BND', 'Vanguard Total Bond', 'etf', 'NYSE'),
('F', 'Ford Motor Company', 'stock', 'NYSE'),
('IBM', 'International Business Machines', 'stock', 'NYSE');

-- Account Holdings (15 entries)
INSERT INTO account_holdings (account_id, instrument_id, quantity, amount_invested) VALUES
(1, 1, 50.5, 8575.00),
(1, 8, 100.0, 42500.00),
(2, 7, 500.0, 150000.00),
(3, 1, 25.0, 4250.00),
(3, 2, 15.0, 5100.00),
(3, 9, 200.0, 35000.00),
(4, 3, 10.0, 1500.00),
(4, 4, 5.0, 1050.00),
(5, 8, 150.0, 63750.00),
(6, 6, 100000.0, 100000.00),
(7, 1, 40.0, 6800.00),
(10, 4, 30.0, 6300.00),
(11, 2, 200.0, 68000.00),
(12, 8, 250.0, 95000.00),
(13, 7, 400.0, 120000.00);

-- Orders (15 orders)
INSERT INTO orders (account_id, instrument_id, quantity, stock_price, order_type, status) VALUES
(1, 1, 10.0, 171.50, 'buy', 'filled'),
(1, 8, 25.0, 425.00, 'buy', 'filled'),
(2, 7, 100.0, 300.00, 'buy', 'placed'),
(3, 1, 15.0, 170.00, 'buy', 'accepted'),
(3, 9, 50.0, 350.00, 'buy', 'filled'),
(4, 3, 5.0, 150.00, 'buy', 'pending'),
(4, 4, 2.0, 210.00, 'sell', 'filled'),
(5, 8, 30.0, 425.00, 'buy', 'filled'),
(7, 1, 20.0, 169.00, 'buy', 'created'),
(10, 4, 15.0, 210.00, 'buy', 'filled'),
(10, 2, 10.0, 340.00, 'buy', 'pending'),
(11, 2, 50.0, 335.00, 'buy', 'placed'),
(12, 8, 75.0, 426.50, 'buy', 'filled'),
(13, 7, 200.0, 300.50, 'buy', 'accepted'),
(1, 1, 5.0, 175.00, 'sell', 'filled');

-- Order Status History (20 entries)
INSERT INTO order_status_history (order_id, changed_at, old_status, new_status) VALUES
(1, NOW() - INTERVAL '40 seconds', 'created', 'pending'),
(1, NOW() - INTERVAL '30 seconds', 'pending', 'placed'),
(1, NOW() - INTERVAL '20 seconds', 'placed', 'accepted'),
(1, NOW() - INTERVAL '10 seconds', 'accepted', 'filled'),
(2, NOW() - INTERVAL '35 seconds', 'created', 'pending'),
(2, NOW() - INTERVAL '25 seconds', 'pending', 'placed'),
(2, NOW() - INTERVAL '15 seconds', 'placed', 'accepted'),
(2, NOW() - INTERVAL '5 seconds', 'accepted', 'filled'),
(3, NOW() - INTERVAL '32 seconds', 'created', 'pending'),
(3, NOW() - INTERVAL '22 seconds', 'pending', 'placed'),
(4, NOW() - INTERVAL '28 seconds', 'created', 'pending'),
(4, NOW() - INTERVAL '18 seconds', 'pending', 'accepted'),
(5, NOW() - INTERVAL '26 seconds', 'created', 'pending'),
(5, NOW() - INTERVAL '16 seconds', 'pending', 'placed'),
(5, NOW() - INTERVAL '12 seconds', 'placed', 'accepted'),
(5, NOW() - INTERVAL '2 seconds', 'accepted', 'filled'),
(8, NOW() - INTERVAL '38 seconds', 'created', 'pending'),
(8, NOW() - INTERVAL '28 seconds', 'pending', 'placed'),
(8, NOW() - INTERVAL '14 seconds', 'placed', 'accepted'),
(8, NOW() - INTERVAL '1 second', 'accepted', 'filled');

-- Account Transactions (18 transactions)
INSERT INTO account_transactions (account_id, order_id, amount, transaction_type) VALUES
(1, 1, 1715.00, 'buy'),
(1, 2, 10625.00, 'buy'),
(2, 3, 30000.00, 'buy'),
(3, 4, 2550.00, 'buy'),
(3, 5, 17500.00, 'buy'),
(4, 6, 750.00, 'buy'),
(4, 7, 420.00, 'sell'),
(5, 8, 12750.00, 'buy'),
(7, 9, 3380.00, 'buy'),
(10, 10, 3150.00, 'buy'),
(10, 11, 3400.00, 'buy'),
(11, 12, 16750.00, 'buy'),
(12, 13, 31987.50, 'buy'),
(13, 14, 60100.00, 'buy'),
(1, 15, 875.00, 'sell'),
(2, 1, 5000.00, 'deposit'),
(3, 2, 2000.00, 'deposit'),
(4, 3, 10000.00, 'withdraw');

-- User Logs (15 entries)
INSERT INTO user_logs (user_id, ip_address, event, status) VALUES
(1, '192.168.1.100', 'User login successful', 'success'),
(1, '192.168.1.100', 'Placed order for AAPL', 'success'),
(2, '192.168.1.101', 'User login successful', 'success'),
(2, '192.168.1.101', 'Placed order for SPY', 'success'),
(3, '192.168.1.102', 'User login successful', 'success'),
(3, '192.168.1.102', 'Cancelled order #4', 'failure'),
(4, '192.168.1.103', 'User login successful', 'success'),
(5, '192.168.1.104', 'User login successful', 'success'),
(6, '192.168.1.200', 'Auditor login successful', 'success'),
(6, '192.168.1.200', 'Accessed audit report', 'success'),
(7, '192.168.1.201', 'Auditor login successful', 'success'),
(8, '192.168.1.300', 'Reporter login successful', 'success'),
(10, '192.168.1.105', 'User login successful', 'success'),
(11, '192.168.1.106', 'User login successful', 'success'),
(12, '192.168.1.107', 'User login failed', 'failure');

-- Transaction Logs (12 entries)
INSERT INTO transaction_log (user_id, account_id, event, ip_address, transaction_id, status) VALUES
(1, 1, 'Buy order executed', '192.168.1.100', 1, 'success'),
(1, 1, 'Buy order executed', '192.168.1.100', 2, 'success'),
(2, 3, 'Buy order placed', '192.168.1.101', 3, 'success'),
(3, 4, 'Buy order executed', '192.168.1.102', 4, 'success'),
(3, 4, 'Sell order executed', '192.168.1.102', 5, 'success'),
(4, 5, 'Buy order executed', '192.168.1.103', 6, 'success'),
(2, 7, 'Deposit received', '192.168.1.101', 7, 'success'),
(3, 14, 'Deposit received', '192.168.1.102', 8, 'success'),
(4, 15, 'Withdrawal processed', '192.168.1.103', 9, 'success'),
(5, 6, 'Buy order placed', '192.168.1.104', 10, 'success'),
(10, 11, 'Buy order executed', '192.168.1.105', 11, 'success'),
(11, 12, 'Buy order placed', '192.168.1.106', 12, 'success');

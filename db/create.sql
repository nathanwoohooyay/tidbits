CREATE TYPE order_type_enum AS ENUM('BUY', 'SELL');
CREATE TYPE order_status_type AS ENUM('CREATED', 'PENDING', 'PLACED', 'ACCEPTED', 'FILLED', 'CANCELED', 'REJECTED');
CREATE TYPE transaction_type AS ENUM('BUY', 'SELL', 'DEPOSIT', 'WITHDRAW');
CREATE TYPE log_status_type AS ENUM('SUCCESS', 'FAILURE');

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    phone_number TEXT UNIQUE,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reward_points INT DEFAULT 0 NOT NULL,
    date_of_birth DATE NOT NULL
);


CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    nickname TEXT,
    cash_balance NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE portfolio_snapshots (
    snapshot_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES accounts(account_id),
    total_value NUMERIC(15, 2) NOT NULL CHECK (total_value > 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE instruments(
    instrument_id SERIAL PRIMARY KEY,
    ticker TEXT NOT NULL UNIQUE CHECK (length(ticker) BETWEEN 1 AND 8),
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    exchange TEXT NOT NULL,
    -- Prices carry 8 decimal places: some coins trade below a cent.
    last_price NUMERIC(19, 8) CHECK (last_price > 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    currency TEXT NOT NULL CHECK (length(currency) = 3),
    change NUMERIC(19, 8),
    change_percent NUMERIC(5, 2),
    prev_close NUMERIC(19, 8)
);

-- Stocks a user follows on the dashboard. Stored by ticker (not instrument) so any searchable stock can be watched.
CREATE TABLE watchlist_items (
    watchlist_item_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    ticker TEXT NOT NULL CHECK (length(ticker) BETWEEN 1 AND 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (user_id, ticker)
);

CREATE TABLE account_holdings (
    account_id INT NOT NULL REFERENCES accounts(account_id),
    instrument_id INT NOT NULL REFERENCES instruments(instrument_id),
    quantity NUMERIC(17, 4) NOT NULL CHECK (quantity > 0),
    amount_invested NUMERIC(15, 2) NOT NULL CHECK (amount_invested > 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    PRIMARY KEY (account_id, instrument_id)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES accounts(account_id),
    instrument_id INT NOT NULL REFERENCES instruments(instrument_id),
    quantity NUMERIC(17, 4) NOT NULL CHECK (quantity > 0),
    stock_price NUMERIC(19, 8) CHECK (stock_price > 0),
    order_type order_type_enum NOT NULL,
    status order_status_type DEFAULT 'CREATED' NOT NULL,
    -- MARKET or LIMIT; limit orders fill only once the price reaches limit_price.
    execution_type TEXT DEFAULT 'MARKET' CHECK (execution_type IN ('MARKET', 'LIMIT')),
    limit_price NUMERIC(19, 8) CHECK (limit_price > 0),
    -- Cash set aside while a buy waits to fill.
    reserved_amount NUMERIC(15, 2) CHECK (reserved_amount >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

CREATE TABLE order_status_history(
    order_id INT NOT NULL REFERENCES orders(order_id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    old_status order_status_type,
    new_status order_status_type NOT NULL,
    PRIMARY KEY (order_id, changed_at)
);

CREATE TABLE account_transactions (
    transaction_id SERIAL PRIMARY KEY,
    account_id INT NOT NULL REFERENCES accounts(account_id),
    order_id INT REFERENCES orders(order_id),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    transaction_type transaction_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    category TEXT NOT NULL CHECK (category IN ('ORDER', 'CASH')),
    title TEXT NOT NULL,
    message TEXT,
    account_id INT,
    order_id INT,
    transaction_id INT,
    ticker TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    read_at TIMESTAMP
);

CREATE INDEX notifications_user_created_idx ON notifications (user_id, created_at);

CREATE TABLE user_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    username TEXT,
    ip_address TEXT,
    event TEXT NOT NULL,
    status log_status_type,
    happened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE transaction_logs(
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    account_id INT NOT NULL REFERENCES accounts(account_id),
    event TEXT NOT NULL,
    amount NUMERIC(15, 2),
    transaction_id INT REFERENCES account_transactions(transaction_id),
    order_id INT REFERENCES orders(order_id),
    status log_status_type,
    happened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Reward points ledger: every earn/spend of users.reward_points, written by client-service.
CREATE TABLE points_transactions (
    points_transaction_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    account_id INT REFERENCES accounts(account_id),
    event_type TEXT NOT NULL,
    points_delta INT NOT NULL CHECK (points_delta <> 0 OR event_type = 'LOTTERY_WIN'),
    balance_after INT NOT NULL CHECK (balance_after >= 0),
    cash_value NUMERIC(15, 2),
    instrument_id INT REFERENCES instruments(instrument_id),
    quantity NUMERIC(17, 4),
    reference_id INT,
    details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_points_transactions_user ON points_transactions (user_id, created_at DESC);

CREATE TABLE lottery_draws (
    draw_id SERIAL PRIMARY KEY,
    ticket_price INT NOT NULL CHECK (ticket_price > 0),
    seed_pot INT NOT NULL CHECK (seed_pot >= 0),
    tickets_sold INT DEFAULT 0 NOT NULL,
    status TEXT NOT NULL,
    opens_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closes_at TIMESTAMP NOT NULL,
    winning_ticket_id INT,
    winner_user_id INT REFERENCES users(user_id),
    prize_points INT,
    prize_code TEXT,
    prize_name TEXT,
    prize_description VARCHAR(1000),
    fulfillment_status TEXT,
    drawn_at TIMESTAMP
);
-- One open draw per prize; legacy points draws have no prize_code.
CREATE UNIQUE INDEX idx_lottery_draws_open_per_prize ON lottery_draws (prize_code) WHERE status = 'OPEN';

CREATE TABLE lottery_tickets (
    ticket_id SERIAL PRIMARY KEY,
    draw_id INT NOT NULL REFERENCES lottery_draws(draw_id),
    user_id INT NOT NULL REFERENCES users(user_id),
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
CREATE INDEX idx_lottery_tickets_draw ON lottery_tickets (draw_id, user_id);

-- Audit copy of points activity, written by audit-service from the points-events topic.
CREATE TABLE points_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(user_id),
    account_id INT REFERENCES accounts(account_id),
    points_transaction_id INT REFERENCES points_transactions(points_transaction_id),
    event TEXT NOT NULL,
    points_delta INT,
    balance_after INT,
    cash_value NUMERIC(15, 2),
    instrument_id INT REFERENCES instruments(instrument_id),
    quantity NUMERIC(17, 4),
    reference_id INT,
    details TEXT,
    status TEXT,
    happened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

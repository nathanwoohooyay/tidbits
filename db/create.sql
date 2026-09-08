CREATE TYPE role_type AS ENUM('client', 'auditor', 'reporter', 'admin');
CREATE TYPE instrument_type AS ENUM('stock', 'bond', 'mutual_fund', 'etf');
CREATE TYPE order_type_enum AS ENUM('buy', 'sell');
CREATE TYPE order_status_type AS ENUM('created', 'pending', 'placed', 'accepted', 'filled', 'canceled', 'rejected');
CREATE TYPE transaction_type AS ENUM('buy', 'sell', 'deposit', 'withdraw');
CREATE TYPE log_status_type AS ENUM('success', 'failure');

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name role_type NOT NULL
);

CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    role_id INT NOT NULL REFERENCES roles(role_id),
    username TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    phone_number TEXT UNIQUE,
    last_login TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    reward_points INT DEFAULT 0 NOT NULL
);

CREATE TABLE accounts (
    account_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    nickname TEXT,
    cash_balance NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE instruments(
    instrument_id SERIAL PRIMARY KEY,
    ticker TEXT NOT NULL UNIQUE CHECK (length(ticker) BETWEEN 1 AND 8),
    name TEXT NOT NULL UNIQUE,
    type instrument_type NOT NULL,
    market TEXT NOT NULL
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
    stock_price NUMERIC(15, 2) NOT NULL CHECK (stock_price > 0),
    order_type order_type_enum NOT NULL,
    status order_status_type DEFAULT 'created' NOT NULL
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
    order_id INT NOT NULL REFERENCES orders(order_id),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    transaction_type transaction_type NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE user_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    ip_address TEXT,
    event TEXT NOT NULL,
    status log_status_type,
    happened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE transaction_log(
    log_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    account_id INT NOT NULL REFERENCES accounts(account_id),
    event TEXT NOT NULL,
    ip_address TEXT,
    transaction_id INT NOT NULL REFERENCES account_transactions(transaction_id),
    status log_status_type,
    happened_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);
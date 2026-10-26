SELECT 'CREATE DATABASE tidbits_auth'
WHERE NOT EXISTS (
    SELECT 1
    FROM pg_database
    WHERE datname = 'tidbits_auth'
)\gexec

\connect tidbits_auth

CREATE TYPE role_type AS ENUM('client', 'auditor', 'reporter', 'admin');

CREATE TABLE IF NOT EXISTS roles (
    role_id SERIAL PRIMARY KEY,
    name role_type NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY,
    password_hash TEXT NOT NULL,
    role_id INT NOT NULL REFERENCES roles(role_id),
    token_version INT DEFAULT 0 NOT NULL
);

-- One row per signed-in device (session). The access token's `sid` claim is this row's token_id.
CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(user_id),
    refresh_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    user_agent TEXT,
    ip_address TEXT,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens (user_id);

-- Failed sign-in counts per "user:<name>|ip:<addr>" and "ip:<addr>" key (see auth-service LoginThrottle).
CREATE TABLE IF NOT EXISTS login_throttle (
    throttle_key TEXT PRIMARY KEY,
    failures INT NOT NULL DEFAULT 0,
    window_started_at TIMESTAMP NOT NULL,
    blocked_until TIMESTAMP
);
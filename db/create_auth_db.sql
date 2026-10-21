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

CREATE TABLE IF NOT EXISTS refresh_tokens (
    token_id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE REFERENCES users(user_id),
    refresh_token TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL
);
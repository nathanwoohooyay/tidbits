\connect tidbits_auth

-- shortcut: relies on fresh main-db seed order preserving user_id 1..10, upgrade to a lookup-based seed if ids stop being deterministic.
INSERT INTO users (user_id, password_hash, role_id, token_version)
VALUES
    (1, 'hash1', 1, 0),
    (2, 'hash2', 1, 0),
    (3, 'hash3', 1, 0),
    (4, 'hash4', 1, 0),
    (5, 'hash5', 1, 0),
    (6, 'hash6', 2, 0),
    (7, 'hash7', 2, 0),
    (8, 'hash8', 3, 0),
    (9, 'hash9', 3, 0),
    (10, 'hash10', 4, 0)
ON CONFLICT (user_id) DO UPDATE
SET
    password_hash = EXCLUDED.password_hash,
    role_id = EXCLUDED.role_id,
    token_version = EXCLUDED.token_version;

INSERT INTO refresh_tokens (user_id, refresh_token, expires_at)
VALUES
    (1, 'rtoken1', CURRENT_TIMESTAMP + INTERVAL '30 days'),
    (2, 'rtoken2', CURRENT_TIMESTAMP + INTERVAL '30 days'),
    (3, 'rtoken3', CURRENT_TIMESTAMP + INTERVAL '30 days'),
    (4, 'rtoken4', CURRENT_TIMESTAMP + INTERVAL '30 days'),
    (5, 'rtoken5', CURRENT_TIMESTAMP + INTERVAL '30 days'),
    (10, 'admintoken', CURRENT_TIMESTAMP + INTERVAL '30 days')
ON CONFLICT (user_id) DO UPDATE
SET
    refresh_token = EXCLUDED.refresh_token,
    expires_at = EXCLUDED.expires_at;
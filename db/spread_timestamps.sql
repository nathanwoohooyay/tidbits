-- Spread timestamps in tidbits_dev and tidbits_auth so seeded data looks realistic.
-- Safe to rerun; it will re-space times from now.
-- Accounts, holdings, orders, order history, transactions, snapshots and transaction logs are
-- already dated relative to CURRENT_DATE in tidbits_dev_seed.sql, so they are not touched here.

BEGIN;

-- users.created_at and users.last_login
WITH ranked AS (
    SELECT user_id, row_number() OVER (ORDER BY user_id) AS rn
    FROM users
), base AS (
    SELECT now() - interval '420 days' AS start_ts
)
UPDATE users u
SET created_at = b.start_ts + (r.rn * interval '8 hours') + (random() * interval '40 minutes'),
    last_login = now() - (random() * interval '3 days')
FROM ranked r
CROSS JOIN base b
WHERE u.user_id = r.user_id;

-- instruments.last_updated
WITH ranked AS (
    SELECT instrument_id, row_number() OVER (ORDER BY instrument_id) AS rn
    FROM instruments
), base AS (
    SELECT now() - interval '20 days' AS start_ts
)
UPDATE instruments i
SET last_updated = b.start_ts + (r.rn * interval '90 minutes') + (random() * interval '15 minutes')
FROM ranked r
CROSS JOIN base b
WHERE i.instrument_id = r.instrument_id;

-- user_logs.happened_at
WITH ranked AS (
    SELECT log_id, row_number() OVER (ORDER BY log_id) AS rn
    FROM user_logs
), base AS (
    SELECT now() - interval '10 days' AS start_ts
)
UPDATE user_logs l
SET happened_at = b.start_ts + (r.rn * interval '25 minutes') + (random() * interval '8 minutes')
FROM ranked r
CROSS JOIN base b
WHERE l.log_id = r.log_id;

-- Signups happen when the user was created, not with the recent logins.
UPDATE user_logs l
SET happened_at = u.created_at + (random() * interval '2 seconds')
FROM users u
WHERE l.user_id = u.user_id
  AND l.event = 'SIGNUP';

COMMIT;

-- Move to auth DB and spread refresh token timestamps as well.
\connect tidbits_auth

BEGIN;

WITH ranked AS (
    SELECT token_id, row_number() OVER (ORDER BY token_id) AS rn
    FROM refresh_tokens
), base AS (
    SELECT now() - interval '9 days' AS start_ts
)
UPDATE refresh_tokens r
SET created_at = b.start_ts + (rk.rn * interval '2 hours') + (random() * interval '10 minutes'),
    expires_at = b.start_ts + (rk.rn * interval '2 hours') + interval '7 days' + (random() * interval '10 minutes')
FROM ranked rk
CROSS JOIN base b
WHERE r.token_id = rk.token_id;

COMMIT;

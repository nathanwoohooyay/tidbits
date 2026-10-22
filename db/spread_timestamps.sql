-- Spread timestamps in tidbits_dev and tidbits_auth so seeded data looks realistic.
-- Safe to rerun; it will re-space times from now.

BEGIN;

-- users.created_at and users.last_login
WITH ranked AS (
    SELECT user_id, row_number() OVER (ORDER BY user_id) AS rn
    FROM users
), base AS (
    SELECT now() - interval '45 days' AS start_ts
)
UPDATE users u
SET created_at = b.start_ts + (r.rn * interval '8 hours') + (random() * interval '40 minutes'),
    last_login = b.start_ts + (r.rn * interval '8 hours') + interval '2 hours' + (random() * interval '90 minutes')
FROM ranked r
CROSS JOIN base b
WHERE u.user_id = r.user_id;

-- accounts.created_at
WITH ranked AS (
    SELECT account_id, row_number() OVER (ORDER BY account_id) AS rn
    FROM accounts
), base AS (
    SELECT now() - interval '40 days' AS start_ts
)
UPDATE accounts a
SET created_at = b.start_ts + (r.rn * interval '4 hours') + (random() * interval '25 minutes')
FROM ranked r
CROSS JOIN base b
WHERE a.account_id = r.account_id;

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

-- account_holdings.last_updated
WITH ranked AS (
    SELECT account_id, instrument_id,
           row_number() OVER (ORDER BY account_id, instrument_id) AS rn
    FROM account_holdings
), base AS (
    SELECT now() - interval '14 days' AS start_ts
)
UPDATE account_holdings h
SET last_updated = b.start_ts + (r.rn * interval '70 minutes') + (random() * interval '12 minutes')
FROM ranked r
CROSS JOIN base b
WHERE h.account_id = r.account_id
  AND h.instrument_id = r.instrument_id;

-- account_transactions.created_at
WITH ranked AS (
    SELECT transaction_id, row_number() OVER (ORDER BY transaction_id) AS rn
    FROM account_transactions
), base AS (
    SELECT now() - interval '12 days' AS start_ts
)
UPDATE account_transactions t
SET created_at = b.start_ts + (r.rn * interval '22 minutes') + (random() * interval '6 minutes')
FROM ranked r
CROSS JOIN base b
WHERE t.transaction_id = r.transaction_id;

-- order_status_history.changed_at
WITH ranked AS (
    SELECT ctid, row_number() OVER (ORDER BY order_id, changed_at, new_status) AS rn
    FROM order_status_history
), base AS (
    SELECT now() - interval '11 days' AS start_ts
)
UPDATE order_status_history o
SET changed_at = b.start_ts + (r.rn * interval '17 minutes') + (random() * interval '4 minutes')
FROM ranked r
CROSS JOIN base b
WHERE o.ctid = r.ctid;

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

-- transaction_logs.happened_at
WITH ranked AS (
    SELECT log_id, row_number() OVER (ORDER BY log_id) AS rn
    FROM transaction_logs
), base AS (
    SELECT now() - interval '10 days' AS start_ts
)
UPDATE transaction_logs l
SET happened_at = b.start_ts + (r.rn * interval '23 minutes') + (random() * interval '7 minutes')
FROM ranked r
CROSS JOIN base b
WHERE l.log_id = r.log_id;

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

// Brings the auth database up to date when the service starts. Every statement is safe to run again.
//  - refresh_tokens holds one row per signed-in device (a session), not one per user, with what the Sessions list
//    shows: the browser's user agent, its IP, and when the session was last renewed.
//  - login_throttle counts failed sign-ins (see LoginThrottle).

type Queryable = {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
};

export const AUTH_SCHEMA_STATEMENTS = [
  'ALTER TABLE refresh_tokens DROP CONSTRAINT IF EXISTS refresh_tokens_user_id_key',
  'ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS user_agent TEXT',
  'ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS ip_address TEXT',
  'ALTER TABLE refresh_tokens ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP',
  'CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON refresh_tokens (user_id)',
  `CREATE TABLE IF NOT EXISTS login_throttle (
    throttle_key TEXT PRIMARY KEY,
    failures INT NOT NULL DEFAULT 0,
    window_started_at TIMESTAMP NOT NULL,
    blocked_until TIMESTAMP
  )`,
];

export async function ensureAuthSchema(pool: Queryable): Promise<void> {
  for (const statement of AUTH_SCHEMA_STATEMENTS) {
    await pool.query(statement);
  }
}

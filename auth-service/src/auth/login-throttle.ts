// Limits repeated failed sign-ins, in the auth database so limits survive restarts:
//  - 5 failures for one username from one IP within 15 minutes block that pair for 15 minutes;
//  - 20 failures from one IP (any usernames) within 15 minutes block that IP for 15 minutes.
// A successful sign-in clears its username+IP count. It doesn't clear the IP's count, or an attacker could reset it
// by signing in to an account of their own between guesses. Nobody can lock someone else out from their own IP.

type Queryable = {
  query: <T = Record<string, unknown>>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }>;
};

export const WINDOW_SECONDS = 15 * 60;
export const BLOCK_SECONDS = 15 * 60;
export const PAIR_LIMIT = 5;
export const IP_LIMIT = 20;

export type ThrottleKeys = { pair: string; ip: string };

export class LoginThrottle {
  constructor(private readonly pool: Queryable) {}

  static keysFor(username: string, ip: string | null): ThrottleKeys {
    const address = ip || 'unknown';
    return {
      pair: `user:${username.trim().toLowerCase()}|ip:${address}`,
      ip: `ip:${address}`,
    };
  }

  // Seconds until the longest block among these keys ends; 0 when none is blocked.
  async retryAfterSeconds(keys: ThrottleKeys): Promise<number> {
    const result = await this.pool.query<{ wait: string | number | null }>(
      `
      SELECT CEIL(EXTRACT(EPOCH FROM MAX(blocked_until) - NOW())) AS wait
      FROM login_throttle
      WHERE throttle_key = ANY($1) AND blocked_until > NOW()
      `,
      [[keys.pair, keys.ip]],
    );
    const wait = Number(result.rows[0]?.wait ?? 0);
    return Number.isFinite(wait) && wait > 0 ? wait : 0;
  }

  async recordFailure(keys: ThrottleKeys): Promise<void> {
    await this.bump(keys.pair, PAIR_LIMIT);
    await this.bump(keys.ip, IP_LIMIT);
  }

  async clear(keys: ThrottleKeys): Promise<void> {
    await this.pool.query('DELETE FROM login_throttle WHERE throttle_key = $1', [keys.pair]);
  }

  // Drops rows whose window and block have both run out.
  async prune(): Promise<void> {
    await this.pool.query(
      `
      DELETE FROM login_throttle
      WHERE window_started_at < NOW() - make_interval(secs => $1)
        AND (blocked_until IS NULL OR blocked_until < NOW())
      `,
      [WINDOW_SECONDS],
    );
  }

  // Counts a failure in the key's current window (starting a new one if the last has passed) and blocks the key once
  // it reaches the limit.
  private async bump(key: string, limit: number): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO login_throttle (throttle_key, failures, window_started_at, blocked_until)
      VALUES ($1, 1, NOW(), CASE WHEN 1 >= $2 THEN NOW() + make_interval(secs => $4) END)
      ON CONFLICT (throttle_key) DO UPDATE SET
        failures = CASE WHEN login_throttle.window_started_at < NOW() - make_interval(secs => $3)
                        THEN 1 ELSE login_throttle.failures + 1 END,
        window_started_at = CASE WHEN login_throttle.window_started_at < NOW() - make_interval(secs => $3)
                                 THEN NOW() ELSE login_throttle.window_started_at END,
        blocked_until = CASE
          WHEN (CASE WHEN login_throttle.window_started_at < NOW() - make_interval(secs => $3)
                     THEN 1 ELSE login_throttle.failures + 1 END) >= $2
            THEN NOW() + make_interval(secs => $4)
          ELSE login_throttle.blocked_until END
      `,
      [key, limit, WINDOW_SECONDS, BLOCK_SECONDS],
    );
  }
}

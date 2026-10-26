import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/auth/auth.service';
import { AuthGuard } from '../../src/authorization/auth.guard';
import type { ThrottleKeys } from '../../src/auth/login-throttle';

type Row = Record<string, unknown>;
type Query = { sql: string; params: unknown[] };

const SECRET = 'test-secret';
const PASSWORD_HASH = bcrypt.hashSync('Password1', 4);

function mockResponse() {
  return {
    statusCode: 200,
    body: undefined as unknown,
    headers: {} as Record<string, string>,
    cookies: [] as unknown[],
    status(code: number) { this.statusCode = code; return this; },
    json(value: unknown) { this.body = value; return value; },
    send() { return this; },
    setHeader(name: string, value: string) { this.headers[name.toLowerCase()] = value; },
    cookie(...args: unknown[]) { this.cookies.push(args); },
  };
}

function mockRequest(overrides: Row = {}) {
  return {
    headers: { 'user-agent': 'Mozilla/5.0 (Macintosh) Chrome/130.0', 'x-real-ip': '203.0.113.9' },
    socket: { remoteAddress: '172.19.0.7' },
    originalUrl: '/api/auth/login',
    cookies: {},
    ...overrides,
  };
}

// An AuthService whose database answers from `respond` and whose login throttle is a recording stub.
function serviceWith(respond: (pool: 'auth' | 'profile', sql: string, params: unknown[]) => { rows: Row[]; rowCount?: number }, retryAfter = 0) {
  process.env.JWT_SECRET = SECRET;
  const service = new AuthService();
  const queries: Array<Query & { pool: string }> = [];
  const throttleCalls: string[] = [];
  for (const pool of ['auth', 'profile'] as const) {
    (service as unknown as Record<string, { query: unknown }>)[`${pool}Pool`].query = async (sql: string, params: unknown[] = []) => {
      queries.push({ pool, sql, params });
      return respond(pool, sql, params);
    };
  }
  (service as unknown as Record<string, unknown>).throttle = {
    retryAfterSeconds: async (keys: ThrottleKeys) => { throttleCalls.push(`check ${keys.pair} ${keys.ip}`); return retryAfter; },
    recordFailure: async (keys: ThrottleKeys) => { throttleCalls.push(`fail ${keys.pair}`); },
    clear: async (keys: ThrottleKeys) => { throttleCalls.push(`clear ${keys.pair}`); },
  };
  return { service, queries, throttleCalls };
}

const loginDb = (pool: 'auth' | 'profile', sql: string) => {
  if (pool === 'profile' && sql.includes('SELECT u.user_id, u.username')) {
    return { rows: [{ user_id: 42, username: 'alice' }] };
  }
  if (pool === 'auth' && sql.includes('SELECT u.password_hash')) {
    return { rows: [{ password_hash: PASSWORD_HASH, token_version: 3, role_name: 'client' }] };
  }
  if (sql.includes('INSERT INTO refresh_tokens')) {
    return { rows: [{ token_id: 77 }] };
  }
  return { rows: [] };
};

test('login is refused with 429 while the username+IP or IP is blocked', async () => {
  const { service, queries, throttleCalls } = serviceWith(loginDb, 600);
  const res = mockResponse();

  await service.login(mockRequest() as never, res as never, { username: 'Alice', password: 'Password1' });

  assert.equal(res.statusCode, 429);
  assert.equal(res.headers['retry-after'], '600');
  assert.equal((res.body as { errorCode: string }).errorCode, 'TOO_MANY_ATTEMPTS');
  assert.match((res.body as { message: string }).message, /Try again in 10 minutes\./);
  assert.deepEqual(throttleCalls, ['check user:alice|ip:203.0.113.9 ip:203.0.113.9']);
  assert.equal(queries.length, 0, 'no password check while blocked');
});

test('a wrong password counts as a failure', async () => {
  const { service, throttleCalls } = serviceWith(loginDb);
  const res = mockResponse();

  await service.login(mockRequest() as never, res as never, { username: 'alice', password: 'Wrong1234' });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(throttleCalls.slice(1), ['fail user:alice|ip:203.0.113.9']);
});

test('an unknown username counts as a failure too', async () => {
  const { service, throttleCalls } = serviceWith(() => ({ rows: [] }));
  const res = mockResponse();

  await service.login(mockRequest() as never, res as never, { username: 'mallory', password: 'Password1' });

  assert.equal(res.statusCode, 401);
  assert.deepEqual(throttleCalls.slice(1), ['fail user:mallory|ip:203.0.113.9']);
});

test('a successful login clears its count and starts a new session with device details', async () => {
  const { service, queries, throttleCalls } = serviceWith(loginDb);
  const res = mockResponse();

  await service.login(mockRequest() as never, res as never, { username: 'alice', password: 'Password1' });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(throttleCalls.slice(1), ['clear user:alice|ip:203.0.113.9']);
  const insert = queries.find((q) => q.sql.includes('INSERT INTO refresh_tokens'));
  assert.ok(insert, 'session row inserted');
  assert.ok(!insert.sql.includes('ON CONFLICT'), 'a second device no longer replaces the first');
  assert.equal(insert.params[0], 42);
  assert.equal(insert.params[3], 'Mozilla/5.0 (Macintosh) Chrome/130.0');
  assert.equal(insert.params[4], '203.0.113.9');
  const token = (res.body as { token: string }).token;
  assert.equal((jwt.verify(token, SECRET) as jwt.JwtPayload).sid, 77);
  assert.equal(res.cookies.length, 1);
});

test('refresh keeps the session id and records activity', async () => {
  const { service, queries } = serviceWith((pool, sql) => {
    if (sql.includes('FROM refresh_tokens r')) {
      return { rows: [{ token_id: 77, user_id: 42, expires_at: new Date(Date.now() + 60_000).toISOString(), token_version: 3 }] };
    }
    if (sql.includes('role.name')) {
      return { rows: [{ role_name: 'client' }] };
    }
    return { rows: [] };
  });
  const res = mockResponse();

  await service.refresh(mockRequest({ cookies: { refreshToken: 'abc' } }) as never, res as never);

  const token = (res.body as { accessToken: string }).accessToken;
  assert.equal((jwt.verify(token, SECRET) as jwt.JwtPayload).sid, 77);
  const touch = queries.find((q) => q.sql.includes('UPDATE refresh_tokens'));
  assert.deepEqual(touch?.params, [77, '203.0.113.9', 'Mozilla/5.0 (Macintosh) Chrome/130.0']);
});

test('listSessions marks the session making the request', async () => {
  const { service } = serviceWith(() => ({
    rows: [
      { token_id: 77, user_agent: 'UA-1', ip_address: '203.0.113.9', created_at: new Date('2026-10-20T10:00:00Z'), last_used_at: new Date('2026-10-26T10:00:00Z') },
      { token_id: 12, user_agent: 'UA-2', ip_address: '198.51.100.20', created_at: new Date('2026-10-19T10:00:00Z'), last_used_at: new Date('2026-10-25T10:00:00Z') },
    ],
  }));
  const res = mockResponse();

  await service.listSessions(mockRequest() as never, res as never, { userId: 42, sessionId: 77 });

  const { sessions } = res.body as { sessions: Array<{ sessionId: number; current: boolean; lastUsedAt: string }> };
  assert.deepEqual(sessions.map((s) => [s.sessionId, s.current]), [[77, true], [12, false]]);
  assert.equal(sessions[0].lastUsedAt, '2026-10-26T10:00:00.000Z');
});

test('signOutOtherSessions ends every session but the current one', async () => {
  const { service, queries } = serviceWith(() => ({ rows: [], rowCount: 2 }));
  const res = mockResponse();

  await service.signOutOtherSessions(mockRequest() as never, res as never, { userId: 42, sessionId: 77 });

  assert.deepEqual(res.body, { signedOut: 2 });
  const del = queries.find((q) => q.sql.includes('DELETE FROM refresh_tokens'));
  assert.deepEqual(del?.params, [42, 77]);
});

test('signOutOtherSessions needs a token that belongs to a session', async () => {
  const { service, queries } = serviceWith(() => ({ rows: [] }));
  const res = mockResponse();

  await service.signOutOtherSessions(mockRequest() as never, res as never, { userId: 42, sessionId: null });

  assert.equal(res.statusCode, 400);
  assert.equal(queries.length, 0);
});

function guardContext(token: string) {
  const req = { headers: { authorization: `Bearer ${token}` }, originalUrl: '/api/auth/sessions' } as Record<string, unknown>;
  const res = mockResponse();
  return {
    req,
    res,
    context: { switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }) } as never,
  };
}

test('the guard rejects tokens whose session has ended', async () => {
  process.env.JWT_SECRET = SECRET;
  const guard = new AuthGuard({ isSessionActive: async () => false } as never);
  const { res, context } = guardContext(jwt.sign({ sub: 42, roles: ['CLIENT'], sid: 9 }, SECRET));

  assert.equal(await guard.canActivate(context), false);
  assert.equal(res.statusCode, 401);
  assert.equal((res.body as { errorCode: string }).errorCode, 'SESSION_ENDED');
});

test('the guard passes live sessions and older tokens without a session id', async () => {
  process.env.JWT_SECRET = SECRET;
  const checked: unknown[] = [];
  const guard = new AuthGuard({ isSessionActive: async (...args: unknown[]) => { checked.push(args); return true; } } as never);

  const live = guardContext(jwt.sign({ sub: 42, roles: ['CLIENT'], sid: 9 }, SECRET));
  assert.equal(await guard.canActivate(live.context), true);
  assert.deepEqual(live.req.user, { userId: 42, roles: ['CLIENT'], sessionId: 9 });

  const legacy = guardContext(jwt.sign({ sub: 42, roles: ['CLIENT'] }, SECRET));
  assert.equal(await guard.canActivate(legacy.context), true);
  assert.deepEqual(checked, [[42, 9]]);
});

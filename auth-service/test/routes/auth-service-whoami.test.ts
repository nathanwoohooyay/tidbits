import test from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { AuthService } from '../../src/auth/auth.service';

type MockRequest = {
  headers: {
    authorization?: string;
  };
  originalUrl: string;
};

type MockResponse = {
  statusCode: number;
  body: unknown;
  status: (code: number) => MockResponse;
  json: (value: unknown) => unknown;
};

function createMockResponse(): MockResponse {
  return {
    statusCode: 200,
    body: undefined,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(value: unknown) {
      this.body = value;
      return value;
    },
  };
}

test('whoAmI returns the authenticated user profile', async () => {
  process.env.JWT_SECRET = 'test-secret';

  const service = new AuthService();
  const token = jwt.sign({ sub: 42 }, 'test-secret', { algorithm: 'HS256' });
  const queryCalls: unknown[] = [];
  const pool = service['pool'] as unknown as {
    query: (sql: string, params: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>;
  };

  pool.query = async (sql: string, params: unknown[]) => {
    queryCalls.push({ sql, params });
    return {
      rows: [{
        userId: 42,
        username: 'alice',
        email: 'alice@example.com',
        phoneNumber: '+15550123',
        rewardPoints: 150,
        dateOfBirth: '1990-04-15',
        lastLogin: '2026-10-12T00:00:00.000Z',
        role: 'CLIENT',
      }],
    };
  };

  const req: MockRequest = {
    headers: {
      authorization: `Bearer ${token}`,
    },
    originalUrl: '/api/auth/whoami',
  };
  const res = createMockResponse();

  await service.whoAmI(req as never, res as never);

  assert.equal(queryCalls.length, 1);
  assert.deepEqual(queryCalls[0], {
    sql: `
        SELECT
          u.user_id AS "userId",
          u.username,
          u.email,
          u.phone_number AS "phoneNumber",
          u.reward_points AS "rewardPoints",
          u.date_of_birth AS "dateOfBirth",
          u.last_login AS "lastLogin",
          UPPER(r.name::text) AS role
        FROM users u
        JOIN roles r ON r.role_id = u.role_id
        WHERE u.user_id = $1
        `,
    params: [42],
  });
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, {
    userId: 42,
    username: 'alice',
    email: 'alice@example.com',
    phoneNumber: '+15550123',
    rewardPoints: 150,
    dateOfBirth: '1990-04-15',
    lastLogin: '2026-10-12T00:00:00.000Z',
    role: 'CLIENT',
  });

  await service.onModuleDestroy();
});

test('whoAmI rejects requests without a bearer token', async () => {
  process.env.JWT_SECRET = 'test-secret';

  const service = new AuthService();
  const req: MockRequest = {
    headers: {},
    originalUrl: '/api/auth/whoami',
  };
  const res = createMockResponse();

  await service.whoAmI(req as never, res as never);

  assert.equal(res.statusCode, 401);
  assert.match(JSON.stringify(res.body), /authorization token is required/);

  await service.onModuleDestroy();
});
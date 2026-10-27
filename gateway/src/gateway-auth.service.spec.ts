import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GatewayAuthService } from './gateway-auth.service.js';

const queryMock = vi.fn();
const endMock = vi.fn().mockResolvedValue(undefined);

// A regular function, so `new Pool()` can construct it.
vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(function () {
    return { query: queryMock, end: endMock, on: vi.fn() };
  }),
}));

const sign = (claims: Record<string, unknown>) => jwt.sign(claims, 'test-secret', { algorithm: 'HS256' });

const requestWith = (token: string | null, originalUrl = '/client/api/users/42') => ({
  originalUrl,
  headers: token ? { authorization: `Bearer ${token}` } : {},
}) as Request;

describe('GatewayAuthService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    queryMock.mockReset();
    endMock.mockClear();
    process.env = {
      ...originalEnv,
      JWT_SECRET: 'test-secret',
      DB_HOST: 'localhost',
      DB_PORT: '5432',
      DB_NAME: 'tidbits',
      DB_USER: 'tester',
      DB_PASSWORD: 'tester',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('accepts a matching token version and a live session', async () => {
    const service = new GatewayAuthService();
    queryMock.mockResolvedValue({ rows: [{ token_version: 3, session_active: true }] });

    await expect(service.authorizeRequest(requestWith(sign({ sub: 42, roles: ['CLIENT'], tokenVersion: 3, sid: 9 })), '/client'))
      .resolves.toBeUndefined();
    expect(queryMock).toHaveBeenCalledWith(expect.stringContaining('FROM users u WHERE u.user_id = $1'), [42, 9]);
  });

  it('rejects a token whose session was signed out', async () => {
    const service = new GatewayAuthService();
    queryMock.mockResolvedValue({ rows: [{ token_version: 3, session_active: false }] });

    await expect(service.authorizeRequest(requestWith(sign({ sub: 42, roles: ['CLIENT'], tokenVersion: 3, sid: 9 })), '/client'))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('accepts tokens issued before sessions were tracked (no sid)', async () => {
    const service = new GatewayAuthService();
    queryMock.mockResolvedValue({ rows: [{ token_version: 3, session_active: true }] });

    await expect(service.authorizeRequest(requestWith(sign({ sub: 42, roles: ['CLIENT'], tokenVersion: 3 })), '/client'))
      .resolves.toBeUndefined();
    expect(queryMock).toHaveBeenCalledWith(expect.any(String), [42, null]);
  });

  it('allows reporter tokens on audit routes', async () => {
    const service = new GatewayAuthService();
    queryMock.mockResolvedValue({ rows: [{ token_version: 3, session_active: true }] });

    await expect(service.authorizeRequest(
      requestWith(sign({ sub: 42, roles: ['REPORTER'], tokenVersion: 3, sid: 1 }), '/audit/api/logs/users'), '/audit',
    )).resolves.toBeUndefined();
  });

  it('forbids client tokens on audit routes', async () => {
    const service = new GatewayAuthService();
    queryMock.mockResolvedValue({ rows: [{ token_version: 3, session_active: true }] });

    await expect(service.authorizeRequest(
      requestWith(sign({ sub: 42, roles: ['CLIENT'], tokenVersion: 3, sid: 1 }), '/audit/api/logs/users'), '/audit',
    )).rejects.toMatchObject({ statusCode: 403 });
  });

  it('allows only admins to see service status', async () => {
    const service = new GatewayAuthService();
    queryMock.mockResolvedValue({ rows: [{ token_version: 3, session_active: true }] });
    const url = '/audit/api/admin/system-health';

    await expect(service.authorizeRequest(requestWith(sign({ sub: 1, roles: ['ADMIN'], tokenVersion: 3, sid: 1 }), url), '/system'))
      .resolves.toBeUndefined();
    await expect(service.authorizeRequest(requestWith(sign({ sub: 2, roles: ['AUDITOR'], tokenVersion: 3, sid: 1 }), url), '/system'))
      .rejects.toMatchObject({ statusCode: 403 });
  });

  it('rejects a mismatched token version', async () => {
    const service = new GatewayAuthService();
    queryMock.mockResolvedValue({ rows: [{ token_version: 5, session_active: true }] });

    await expect(service.authorizeRequest(requestWith(sign({ sub: '42', roles: ['CLIENT'], tokenVersion: '2', sid: 1 })), '/client'))
      .rejects.toMatchObject({ statusCode: 401 });
  });

  it('rejects missing authorization on protected routes', async () => {
    const service = new GatewayAuthService();

    await expect(service.authorizeRequest(requestWith(null), '/client'))
      .rejects.toMatchObject({ statusCode: 401 });
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('allows unauthenticated OPTIONS preflight requests', async () => {
    const service = new GatewayAuthService();
    const request = { method: 'OPTIONS', originalUrl: '/audit/api/logs/users', headers: {} } as Request;

    await expect(service.authorizeRequest(request, '/audit')).resolves.toBeUndefined();
  });
});

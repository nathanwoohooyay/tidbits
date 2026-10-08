import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GatewayAuthError, GatewayAuthService } from './gateway-auth.service.js';

const queryMock = vi.fn();
const endMock = vi.fn().mockResolvedValue(undefined);

vi.mock('pg', () => ({
  Pool: vi.fn().mockImplementation(() => ({
    query: queryMock,
    end: endMock,
  })),
}));

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

  it('skips JWT validation for public client routes', async () => {
    const service = new GatewayAuthService();
    const request = {
      originalUrl: '/client/public',
      headers: {},
    } as Request;

    await expect(service.authorizeRequest(request, '/client')).resolves.toBeUndefined();
    expect(queryMock).not.toHaveBeenCalled();
  });

  it('accepts a matching token version', async () => {
    const service = new GatewayAuthService();
    const token = jwt.sign({ sub: 42, roles: ['CLIENT'], tokenVersion: 3 }, 'test-secret', {
      algorithm: 'HS256',
    });
    const request = {
      originalUrl: '/client/api/users/42',
      headers: { authorization: `Bearer ${token}` },
    } as Request;

    queryMock.mockResolvedValue({ rows: [{ token_version: 3 }] });

    await expect(service.authorizeRequest(request, '/client')).resolves.toBeUndefined();
    expect(queryMock).toHaveBeenCalledWith(
      'SELECT token_version FROM users WHERE user_id = $1',
      [42],
    );
  });

  it('rejects a mismatched token version with forbidden', async () => {
    const service = new GatewayAuthService();
    const token = jwt.sign({ sub: '42', roles: ['CLIENT'], tokenVersion: '2' }, 'test-secret', {
      algorithm: 'HS256',
    });
    const request = {
      originalUrl: '/audit/api/logs/users',
      headers: { authorization: `Bearer ${token}` },
    } as Request;

    queryMock.mockResolvedValue({ rows: [{ token_version: 5 }] });

    await expect(service.authorizeRequest(request, '/audit')).rejects.toMatchObject<GatewayAuthError>({
      statusCode: 403,
      message: 'JWT tokenVersion no longer matches the stored user token version',
    });
  });

  it('rejects missing authorization on protected routes', async () => {
    const service = new GatewayAuthService();
    const request = {
      originalUrl: '/client/api/orders',
      headers: {},
    } as Request;

    await expect(service.authorizeRequest(request, '/client')).rejects.toMatchObject<GatewayAuthError>({
      statusCode: 401,
      message: 'Authorization header is required',
    });
  });

  it('allows unauthenticated OPTIONS preflight requests', async () => {
    const service = new GatewayAuthService();
    const request = {
      method: 'OPTIONS',
      originalUrl: '/audit/api/logs/users',
      headers: {},
    } as Request;

    await expect(service.authorizeRequest(request, '/audit')).resolves.toBeUndefined();
  });
});
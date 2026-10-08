import type { Request, Response } from 'express';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppService } from './app.service.js';
import { GatewayAuthError, GatewayAuthService } from './gateway-auth.service.js';

describe('AppService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('returns auth failures without forwarding upstream', async () => {
    const gatewayAuthService = {
      authorizeRequest: vi.fn().mockRejectedValue(new GatewayAuthError(403, 'forbidden')),
    } as unknown as GatewayAuthService;

    const service = new AppService(gatewayAuthService);
    const response = createResponseDouble();

    await service.proxyToClient(
      {
        originalUrl: '/client/api/orders',
        method: 'GET',
        headers: {},
      } as Request,
      response as Response,
    );

    expect(gatewayAuthService.authorizeRequest).toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ statusCode: 403, message: 'forbidden' });
  });

  it('forwards when authorization succeeds', async () => {
    const gatewayAuthService = {
      authorizeRequest: vi.fn().mockResolvedValue(undefined),
    } as unknown as GatewayAuthService;

    const service = new AppService(gatewayAuthService);
    const response = createResponseDouble();
    const upstreamResponse = {
      status: 200,
      headers: new Headers(),
      arrayBuffer: vi.fn().mockResolvedValue(new TextEncoder().encode('ok')),
    } as unknown as globalThis.Response;

    vi.mocked(global.fetch).mockResolvedValue(upstreamResponse);

    await service.proxyToClient(
      {
        originalUrl: '/client/api/orders?status=open',
        method: 'GET',
        headers: { authorization: 'Bearer token' },
      } as Request,
      response as Response,
    );

    expect(gatewayAuthService.authorizeRequest).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:9875/api/orders?status=open', {
      method: 'GET',
      headers: expect.any(Headers),
      body: undefined,
      redirect: 'manual',
    });
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.send).toHaveBeenCalledWith(Buffer.from('ok'));
  });
});

function createResponseDouble() {
  const response = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn(),
  };

  return response;
}
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { GatewayAuthError, GatewayAuthService } from './gateway-auth.service.js';
import { SystemHealthController } from './system-health.controller.js';
import { SystemHealthService } from './system-health.service.js';

async function appWith(authorizeRequest: () => Promise<void>) {
  const proxyToAudit = vi.fn(async (_req: unknown, res: { status: (code: number) => { send: (body: string) => void } }) => {
    res.status(200).send('proxied');
  });
  const getHealth = vi.fn().mockResolvedValue({ checkedAt: '2026-10-26T15:00:00Z', components: [{ id: 'gateway', name: 'Gateway', status: 'up' }] });
  const moduleRef = await Test.createTestingModule({
    controllers: [SystemHealthController, AppController],
    providers: [
      { provide: AppService, useValue: { proxyToAudit } },
      { provide: GatewayAuthService, useValue: { authorizeRequest: vi.fn(authorizeRequest) } },
      { provide: SystemHealthService, useValue: { getHealth } },
    ],
  }).compile();
  const app = moduleRef.createNestApplication();
  await app.init();
  return { app, proxyToAudit, getHealth };
}

describe('SystemHealthController', () => {
  it('answers the status route itself instead of proxying it to the audit service', async () => {
    const { app, proxyToAudit } = await appWith(async () => undefined);

    const response = await request(app.getHttpServer()).get('/audit/api/admin/system-health').expect(200);

    expect(response.body.components[0]).toEqual({ id: 'gateway', name: 'Gateway', status: 'up' });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(proxyToAudit).not.toHaveBeenCalled();

    await request(app.getHttpServer()).get('/audit/api/admin/users').expect(200, 'proxied');
    await app.close();
  });

  it('refuses callers the gateway does not authorize', async () => {
    const { app, getHealth } = await appWith(async () => {
      throw new GatewayAuthError(403, 'Forbidden');
    });

    await request(app.getHttpServer()).get('/audit/api/admin/system-health').expect(403, { statusCode: 403, message: 'Forbidden' });
    expect(getHealth).not.toHaveBeenCalled();
    await app.close();
  });
});

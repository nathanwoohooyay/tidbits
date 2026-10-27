import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SystemHealthService } from './system-health.service.js';

const URLS = {
  auth: 'http://auth:4000/api/auth/health',
  client: 'http://client:8082/api/health',
  audit: 'http://audit:8083/api/health',
  metrics: 'http://metrics:8085/api/metrics/health',
};

const up = { status: 'up', checks: { database: { status: 'up', latencyMs: 2 }, kafka: { status: 'up', latencyMs: 5 } } };
const clientUp = { ...up, marketData: { status: 'up', lastSuccessAt: '2026-10-26T15:00:00Z' } };

type Answer = { status?: number; body?: unknown; error?: Error; delayMs?: number };

function stubServices(answers: Partial<Record<keyof typeof URLS, Answer>>) {
  const fetchMock = vi.fn(async (url: string) => {
    const [name] = Object.entries(URLS).find(([, value]) => value === url)!;
    const answer = answers[name as keyof typeof URLS] ?? { body: name === 'client' ? clientUp : up };
    if (answer.delayMs) {
      await new Promise((resolve) => setTimeout(resolve, answer.delayMs));
    }
    if (answer.error) {
      throw answer.error;
    }
    return new Response(JSON.stringify(answer.body), { status: answer.status ?? 200 });
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

const byId = (health: Awaited<ReturnType<SystemHealthService['getHealth']>>) =>
  Object.fromEntries(health.components.map((component) => [component.id, component]));

describe('SystemHealthService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      AUTH_SERVICE_URL: 'http://auth:4000',
      CLIENT_SERVICE_URL: 'http://client:8082/',
      AUDIT_SERVICE_URL: 'http://audit:8083',
      METRICS_SERVICE_URL: 'http://metrics:8085',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('reports every component up when every service is', async () => {
    stubServices({});

    const health = await new SystemHealthService().getHealth();

    expect(health.components.map((component) => component.id))
      .toEqual(['gateway', 'auth', 'client', 'audit', 'metrics', 'market-data']);
    expect(health.components.every((component) => component.status === 'up')).toBe(true);
    expect(byId(health).client.latencyMs).toEqual(expect.any(Number));
    expect(byId(health)['market-data'].lastSuccessAt).toBe('2026-10-26T15:00:00Z');
  });

  it('says why a service is down', async () => {
    stubServices({
      auth: { error: new TypeError('fetch failed') },
      audit: { error: Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' }) },
      metrics: { status: 503, body: { status: 'down', checks: { database: { status: 'down', reason: 'Database unreachable' } } } },
    });

    const components = byId(await new SystemHealthService().getHealth());

    expect(components.auth).toMatchObject({ status: 'down', reason: 'Not responding' });
    expect(components.audit).toMatchObject({ status: 'down', reason: 'Timed out' });
    expect(components.metrics).toMatchObject({ status: 'down', reason: 'Database unreachable' });
  });

  it('is degraded, not down, when only Kafka is', async () => {
    stubServices({
      client: { status: 503, body: { status: 'down', checks: { database: { status: 'up' }, kafka: { status: 'down', reason: 'Kafka unreachable' } }, marketData: { status: 'up' } } },
    });

    const components = byId(await new SystemHealthService().getHealth());

    expect(components.client).toMatchObject({ status: 'degraded', reason: 'Kafka unreachable' });
    expect(components['market-data'].status).toBe('up');
  });

  it('marks a service that takes over a second as slow', async () => {
    stubServices({ metrics: { body: up, delayMs: 1050 } });

    const components = byId(await new SystemHealthService().getHealth());

    expect(components.metrics).toMatchObject({ status: 'slow', reason: 'Slow to respond' });
  });

  it('passes on the price feed state, and does not guess it when the client service is down', async () => {
    stubServices({ client: { body: { ...up, marketData: { status: 'down', reason: 'API key rejected' } } } });
    expect(byId(await new SystemHealthService().getHealth())['market-data'])
      .toMatchObject({ status: 'down', reason: 'API key rejected' });

    stubServices({ client: { error: new TypeError('fetch failed') } });
    expect(byId(await new SystemHealthService().getHealth())['market-data'])
      .toMatchObject({ status: 'unknown', reason: 'Client service not responding' });
  });

  it('reuses a result for ten seconds', async () => {
    const fetchMock = stubServices({});
    const now = vi.spyOn(Date, 'now').mockReturnValue(1_000_000);
    const service = new SystemHealthService();

    await Promise.all([service.getHealth(), service.getHealth()]);
    now.mockReturnValue(1_009_000);
    await service.getHealth();
    expect(fetchMock).toHaveBeenCalledTimes(4);

    now.mockReturnValue(1_010_000);
    await service.getHealth();
    expect(fetchMock).toHaveBeenCalledTimes(8);
  });
});

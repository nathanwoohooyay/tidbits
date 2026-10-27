import { Injectable } from '@nestjs/common';

export type HealthStatus = 'up' | 'slow' | 'degraded' | 'down' | 'unknown';

export interface ComponentHealth {
  id: string;
  name: string;
  status: HealthStatus;
  latencyMs?: number;
  reason?: string;
  // Market data only: when a price was last fetched successfully.
  lastSuccessAt?: string;
}

export interface SystemHealth {
  checkedAt: string;
  components: ComponentHealth[];
}

type DependencyCheck = { status?: string; reason?: string };
type ServiceHealthBody = {
  status?: string;
  checks?: Record<string, DependencyCheck>;
  marketData?: { status?: string; reason?: string; lastSuccessAt?: string };
};
type Probe =
  | { kind: 'answered'; httpStatus: number; latencyMs: number; body: ServiceHealthBody | undefined }
  | { kind: 'timeout' | 'unreachable' };

const PROBE_TIMEOUT_MS = 3000;
const SLOW_MS = 1000;
const CACHE_MS = 10_000;
const FEED_STATUSES = new Set<HealthStatus>(['up', 'degraded', 'down', 'unknown']);

const baseUrl = (url: string) => (url.endsWith('/') ? url.slice(0, -1) : url);

// Asks every backend service's health endpoint at once and turns the answers into one status per component for the
// admin dashboard. A result is reused for a few seconds and concurrent callers share one round of checks, so open
// dashboards don't multiply the load on the services.
@Injectable()
export class SystemHealthService {
  private readonly services = [
    { id: 'auth', name: 'Auth service', url: `${baseUrl(process.env.AUTH_SERVICE_URL ?? 'http://localhost:4000')}/api/auth/health` },
    { id: 'client', name: 'Client service', url: `${baseUrl(process.env.CLIENT_SERVICE_URL ?? 'http://localhost:9875')}/api/health` },
    { id: 'audit', name: 'Audit service', url: `${baseUrl(process.env.AUDIT_SERVICE_URL ?? 'http://localhost:9874')}/api/health` },
    { id: 'metrics', name: 'Metrics service', url: `${baseUrl(process.env.METRICS_SERVICE_URL ?? 'http://localhost:9873')}/api/metrics/health` },
  ];

  private cached: { at: number; result: Promise<SystemHealth> } | null = null;

  getHealth(): Promise<SystemHealth> {
    const now = Date.now();
    if (!this.cached || now - this.cached.at >= CACHE_MS) {
      this.cached = { at: now, result: this.checkAll() };
    }
    return this.cached.result;
  }

  private async checkAll(): Promise<SystemHealth> {
    const probes = await Promise.all(this.services.map((service) => probe(service.url)));
    const components: ComponentHealth[] = [
      // This answer is coming through the gateway, so it is up.
      { id: 'gateway', name: 'Gateway', status: 'up' },
      ...this.services.map((service, i) => ({ id: service.id, name: service.name, ...summarize(probes[i]) })),
      marketData(probes[this.services.findIndex((service) => service.id === 'client')]),
    ];
    return { checkedAt: new Date().toISOString(), components };
  }
}

async function probe(url: string): Promise<Probe> {
  const started = Date.now();
  try {
    const response = await fetch(url, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(PROBE_TIMEOUT_MS) });
    const latencyMs = Date.now() - started;
    const body = (await response.json().catch(() => undefined)) as ServiceHealthBody | undefined;
    return { kind: 'answered', httpStatus: response.status, latencyMs, body };
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError');
    return { kind: timedOut ? 'timeout' : 'unreachable' };
  }
}

// A service is down when it doesn't answer or its database is down (it can't do anything useful), degraded when
// something else it depends on is down (Kafka: it works, but audit events are lost), and slow past a second.
function summarize(result: Probe): Pick<ComponentHealth, 'status' | 'latencyMs' | 'reason'> {
  if (result.kind !== 'answered') {
    return { status: 'down', reason: result.kind === 'timeout' ? 'Timed out' : 'Not responding' };
  }
  const { httpStatus, latencyMs, body } = result;
  const failing = Object.entries<DependencyCheck>(body?.checks ?? {}).filter(([, check]) => check?.status !== 'up');
  const reason = failing.map(([, check]) => check?.reason ?? 'Check failed').join(', ');
  if (failing.some(([name]) => /database/i.test(name))) {
    return { status: 'down', latencyMs, reason };
  }
  if (failing.length > 0) {
    return { status: 'degraded', latencyMs, reason };
  }
  if (httpStatus >= 400 || body?.status !== 'up') {
    return { status: 'down', latencyMs, reason: `Unexpected response (HTTP ${httpStatus})` };
  }
  if (latencyMs > SLOW_MS) {
    return { status: 'slow', latencyMs, reason: 'Slow to respond' };
  }
  return { status: 'up', latencyMs };
}

// The client service reports the price feed it uses alongside its own health.
function marketData(clientProbe: Probe): ComponentHealth {
  const component = { id: 'market-data', name: 'Market data feed' };
  if (clientProbe.kind !== 'answered') {
    return { ...component, status: 'unknown', reason: 'Client service not responding' };
  }
  const feed = clientProbe.body?.marketData;
  if (!feed) {
    return { ...component, status: 'unknown', reason: 'Not reported' };
  }
  const status = FEED_STATUSES.has(feed.status as HealthStatus) ? (feed.status as HealthStatus) : 'unknown';
  return { ...component, status, reason: feed.reason, lastSuccessAt: feed.lastSuccessAt };
}

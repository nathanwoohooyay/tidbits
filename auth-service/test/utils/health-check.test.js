const test = require('node:test');
const assert = require('node:assert/strict');
const { timedCheck } = require('../../src/utils/healthCheck');

test('timedCheck reports up with the time taken', async () => {
  const result = await timedCheck(() => new Promise((resolve) => setTimeout(resolve, 20)), 'Database unreachable');

  assert.equal(result.status, 'up');
  assert.ok(result.latencyMs >= 15);
});

test('timedCheck reports the given reason when the check fails', async () => {
  const result = await timedCheck(() => Promise.reject(new Error('ECONNREFUSED 10.0.0.5:5432')), 'Database unreachable');

  assert.deepEqual(result, { status: 'down', reason: 'Database unreachable' });
});

test('timedCheck gives up on a check that hangs', async () => {
  const started = Date.now();
  const result = await timedCheck(() => new Promise(() => {}), 'Kafka unreachable', 50);

  assert.deepEqual(result, { status: 'down', reason: 'Kafka unreachable' });
  assert.ok(Date.now() - started < 1000);
});

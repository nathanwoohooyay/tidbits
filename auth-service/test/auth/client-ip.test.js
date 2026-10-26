const test = require('node:test');
const assert = require('node:assert/strict');
const { clientIp } = require('../../src/utils/clientIp');

const req = (peer, headers = {}) => ({ socket: { remoteAddress: peer }, headers });

test('uses X-Real-IP from our own proxy on the Docker network', () => {
  assert.equal(clientIp(req('172.19.0.7', { 'x-real-ip': '203.0.113.9' })), '203.0.113.9');
  assert.equal(clientIp(req('::ffff:10.0.0.4', { 'x-real-ip': '203.0.113.9' })), '203.0.113.9');
});

test('ignores X-Real-IP sent by anyone else', () => {
  assert.equal(clientIp(req('198.51.100.20', { 'x-real-ip': '203.0.113.9' })), '198.51.100.20');
});

test('never trusts X-Forwarded-For, whose first entry the client controls', () => {
  assert.equal(clientIp(req('172.19.0.7', { 'x-forwarded-for': '1.2.3.4, 203.0.113.9' })), '172.19.0.7');
  assert.equal(clientIp(req('198.51.100.20', { 'x-forwarded-for': '1.2.3.4' })), '198.51.100.20');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { isAuditLoginRole } from '../../src/auth/rolePolicy';

test('allows only audit portal roles to log in', () => {
  assert.equal(isAuditLoginRole('admin'), true);
  assert.equal(isAuditLoginRole('AUDITOR'), true);
  assert.equal(isAuditLoginRole(' reporter '), true);
  assert.equal(isAuditLoginRole('client'), false);
  assert.equal(isAuditLoginRole(undefined), false);
});
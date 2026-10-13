const AUDIT_LOGIN_ROLES = new Set(['ADMIN', 'AUDITOR', 'REPORTER']);

export function isAuditLoginRole(roleName: string | undefined): boolean {
  return AUDIT_LOGIN_ROLES.has(String(roleName || '').trim().toUpperCase());
}
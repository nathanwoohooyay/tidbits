# Bruno Test Pack for Tidbits

This folder contains a practical, runnable Bruno collection for your current services.

## Included request groups

- 00-auth
- 10-client-users
- 20-client-accounts
- 30-client-orders
- 40-client-pricing
- 50-audit

## Quick start

1. Start services:
   - docker compose up -d
2. Open Bruno and load this folder as a collection:
   - bruno/
3. Select environment:
   - environments/local.bru
4. Run in this order:
   - 00-auth/01-health
   - 00-auth/02-signup
   - 00-auth/03-login
5. Copy the returned token from login into `client_token` in the environment.
6. Set `user_id` from signup response (`user.user_id`).
7. Run client requests in groups 10/20/30/40.
8. For audit requests, set `audit_token` to a token with AUDITOR or ADMIN role.

## Admin-only audit actions

- 50-audit/04-update-user-role-admin
- 50-audit/05-revoke-user-admin

These require `admin_token` with role ADMIN.

If you need to promote a user to admin for testing, use SQL in Postgres:

```sql
UPDATE users
SET role_id = (SELECT role_id FROM roles WHERE name = 'admin')
WHERE user_id = <your_user_id>;
```

Then log in again to obtain a token containing role ADMIN.

## Known stub endpoints in current codebase

These exist but currently return placeholder/null values:

- GET /api/accounts/{accountId}/transactions/{transactionId}
- GET /api/accounts/{accountId}/transactions
- GET /api/accounts/{accountId}/holdings/{holdingId}
- GET /api/accounts/{accountId}/holdings/
- PATCH /api/users/{userId}

The collection intentionally focuses on endpoints with meaningful behavior.

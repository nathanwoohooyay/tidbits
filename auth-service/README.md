# Mission Auth Stub

A minimal Node.js service that issues JWTs. Used from Module 9 onward as the "separate identity
service" the mission service trusts, without validating credentials itself — the mission service's
job is to check a token's *signature*, never to know a username or password.

## Run it

```bash
cd shared/auth-stub
npm install
npm start
```

Listens on `http://localhost:4000`.

## Get a token

```bash
curl -X POST http://localhost:4000/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"mission123"}'
```

Returns `{"token": "eyJhbGc..."}`. Use `bob`/`wrongpermissions` to see a `GUEST`-role token
instead of a `MISSION_OPERATOR` one, or any wrong password to see a `401`.

## Tests

Run all auth-service tests:

```bash
npm test
```

Run only auth validation tests:

```bash
npm run test:auth-validation
```

Test suite layout is organized by feature so new tests can grow without touching existing paths:

- `test/validation/*.test.js` for request and rule validation modules
- `test/routes/*.test.js` for endpoint behavior and status code contracts
- `test/utils/*.test.js` for shared helpers like DTO mapping or error formatting

Current suite includes `test/validation/authValidation.test.js`, covering signup/login input checks,
password/email/phone rules, and duplicate-field conflict mapping.

## The shared secret

The mission service (Java) and this stub both know the same HMAC secret
(`mission-control-shared-secret-key-32-bytes-minimum` by default, overridable via the `JWT_SECRET`
environment variable). That shared secret is the entire trust relationship — the mission service
never calls this service at request time; it just verifies a token's signature could only have
been produced by something that knows the same secret.

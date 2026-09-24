const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateSignupInput,
  validateLoginInput,
  getSignupConflictError,
} = require('../../src/validation/authValidation');

test('validateSignupInput returns 400 for non-string or missing required fields', () => {
  const cases = [
    undefined,
    {},
    { username: null, password: 'Password1', email: 'user@example.com', phoneNumber: '555 555 5555' },
    { username: 'alice', password: null, email: 'user@example.com', phoneNumber: '555 555 5555' },
    { username: 'alice', password: 'Password1', email: 12, phoneNumber: '555 555 5555' },
    { username: 'alice', password: 'Password1', email: 'user@example.com', phoneNumber: {} },
    { username: '   ', password: 'Password1', email: 'user@example.com', phoneNumber: '555 555 5555' },
  ];

  for (const payload of cases) {
    const result = validateSignupInput(payload);
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
    assert.equal(result.errorCode, 'INVALID_REQUEST_BODY');
  }
});

test('validateSignupInput returns 422 for invalid email', () => {
  const result = validateSignupInput({
    username: 'alice',
    password: 'Password1',
    email: 'invalid-email',
    phoneNumber: '5555555555',
  });

  assert.deepEqual(result, {
    ok: false,
    status: 422,
    errorCode: 'INVALID_EMAIL',
    message: 'email not valid',
  });
});

test('validateSignupInput returns 422 for invalid phone number', () => {
  const result = validateSignupInput({
    username: 'alice',
    password: 'Password1',
    email: 'alice@example.com',
    phoneNumber: '12345',
  });

  assert.deepEqual(result, {
    ok: false,
    status: 422,
    errorCode: 'INVALID_PHONE_NUMBER',
    message: 'phone number not valid',
  });
});

test('validateSignupInput returns 422 for invalid password', () => {
  const result = validateSignupInput({
    username: 'alice',
    password: 'password',
    email: 'alice@example.com',
    phoneNumber: '5555555555',
  });

  assert.deepEqual(result, {
    ok: false,
    status: 422,
    errorCode: 'INVALID_PASSWORD',
    message: 'password not valid',
  });
});

test('validateSignupInput returns normalized data for valid input', () => {
  const result = validateSignupInput({
    username: '  alice  ',
    password: 'Password1',
    email: '  alice@example.com  ',
    phoneNumber: '  5555555555  ',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.data, {
    normalizedUsername: 'alice',
    normalizedEmail: 'alice@example.com',
    normalizedPhoneNumber: '5555555555',
    password: 'Password1',
  });
});

test('validateLoginInput returns 400 for non-string or missing username/password', () => {
  const cases = [
    undefined,
    {},
    { username: null, password: 'Password1' },
    { username: 'alice', password: null },
    { username: 100, password: 'Password1' },
    { username: 'alice', password: ['Password1'] },
    { username: '   ', password: 'Password1' },
  ];

  for (const payload of cases) {
    const result = validateLoginInput(payload);
    assert.equal(result.ok, false);
    assert.equal(result.status, 400);
    assert.equal(result.errorCode, 'INVALID_REQUEST_BODY');
  }
});

test('validateLoginInput returns normalized username and password for valid input', () => {
  const result = validateLoginInput({ username: '  alice  ', password: 'Password1' });

  assert.equal(result.ok, true);
  assert.deepEqual(result.data, {
    normalizedUsername: 'alice',
    password: 'Password1',
  });
});

test('getSignupConflictError resolves username conflict', () => {
  const result = getSignupConflictError({
    constraint: 'users_username_key',
    detail: 'Key (username)=(alice) already exists.',
  });

  assert.deepEqual(result, {
    errorCode: 'USERNAME_ALREADY_EXISTS',
    message: 'username already exists',
  });
});

test('getSignupConflictError resolves email conflict', () => {
  const result = getSignupConflictError({
    constraint: 'users_email_key',
    detail: 'Key (email)=(alice@example.com) already exists.',
  });

  assert.deepEqual(result, {
    errorCode: 'EMAIL_ALREADY_EXISTS',
    message: 'email already exists',
  });
});

test('getSignupConflictError resolves phone conflict', () => {
  const result = getSignupConflictError({
    constraint: 'users_phone_number_key',
    detail: 'Key (phone_number)=(+1 555 555 5555) already exists.',
  });

  assert.deepEqual(result, {
    errorCode: 'PHONE_NUMBER_ALREADY_EXISTS',
    message: 'phone number already exists',
  });
});

test('getSignupConflictError falls back to generic conflict when field is unknown', () => {
  const result = getSignupConflictError({ constraint: 'users_role_id_key' });

  assert.deepEqual(result, {
    errorCode: 'RESOURCE_ALREADY_EXISTS',
    message: 'resource already exists',
  });
});


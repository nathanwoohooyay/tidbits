const { isPossiblePhoneNumber, parsePhoneNumberFromString } = require('libphonenumber-js');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[A-Za-z0-9._-]{3,30}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,20}$/;
const PHONE_ALLOWED_CHARS_REGEX = /^\+?[\d\s().-]{7,25}$/;

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidPhoneNumber(phoneNumber) {
  const trimmed = phoneNumber.trim();
  if (!PHONE_ALLOWED_CHARS_REGEX.test(trimmed)) {
    return false;
  }

  return isPossiblePhoneNumber(phoneNumber, 'US');
}

function isValidUsername(username) {
  return USERNAME_REGEX.test(username.trim());
}

function validateSignupInput(payload) {
  const { username, email, password, phoneNumber, dateOfBirth } = payload || {};

  if (!isNonEmptyString(username) || !isNonEmptyString(password) || !isNonEmptyString(email) || !isNonEmptyString(phoneNumber) || !isNonEmptyString(dateOfBirth)) {
    return {
      ok: false,
      status: 400,
      errorCode: 'INVALID_REQUEST_BODY',
      message: 'username, password, email, phoneNumber, and dateOfBirth must be non-null strings',
    };
  }

  const normalizedUsername = username.trim();
  const normalizedEmail = email.trim();

  if (!isValidUsername(normalizedUsername)) {
    return {
      ok: false,
      status: 422,
      errorCode: 'INVALID_USERNAME',
      message: 'username must be 3-30 characters and use only letters, numbers, periods, underscores, or hyphens',
    };
  }

  const phoneNumberObject = parsePhoneNumberFromString(`+1${phoneNumber.trim()}`);

  if (!EMAIL_REGEX.test(normalizedEmail)) {
    return {
      ok: false,
      status: 422,
      errorCode: 'INVALID_EMAIL',
      message: 'enter a valid email address',
    };
  }

  if (phoneNumberObject === undefined || !isValidPhoneNumber(phoneNumberObject.nationalNumber)) {
    return {
      ok: false,
      status: 422,
      errorCode: 'INVALID_PHONE_NUMBER',
      message: 'enter a valid 10-digit US phone number',
    };
  }
  const normalizedPhoneNumber = phoneNumberObject.nationalNumber

  if (!PASSWORD_REGEX.test(password)) {
    return {
      ok: false,
      status: 422,
      errorCode: 'INVALID_PASSWORD',
      message: 'password must be 8-20 characters and include uppercase, lowercase, and a number',
    };
  }

  return {
    ok: true,
    data: {
      normalizedUsername,
      normalizedEmail,
      normalizedPhoneNumber,
      password,
      dateOfBirth,
    },
  };
}

function validateLoginInput(payload) {
  const { username, password } = payload || {};

  if (!isNonEmptyString(username) || !isNonEmptyString(password)) {
    return {
      ok: false,
      status: 400,
      errorCode: 'INVALID_REQUEST_BODY',
      message: 'username and password must be non-null strings',
    };
  }

  return {
    ok: true,
    data: {
      normalizedUsername: username.trim(),
      password,
    },
  };
}

function getSignupConflictError(dbError) {
  const constraint = String(dbError?.constraint || '').toLowerCase();
  const detail = String(dbError?.detail || '').toLowerCase();

  if (constraint.includes('username') || detail.includes('(username)=')) {
    return { errorCode: 'USERNAME_ALREADY_EXISTS', message: 'username already exists' };
  }
  if (constraint.includes('email') || detail.includes('(email)=')) {
    return { errorCode: 'EMAIL_ALREADY_EXISTS', message: 'email already exists' };
  }
  if (constraint.includes('phone') || detail.includes('(phone_number)=') || detail.includes('(phonenumber)=')) {
    return { errorCode: 'PHONE_NUMBER_ALREADY_EXISTS', message: 'phone number already exists' };
  }

  return { errorCode: 'RESOURCE_ALREADY_EXISTS', message: 'resource already exists' };
}

module.exports = {
  validateSignupInput,
  validateLoginInput,
  getSignupConflictError,
};


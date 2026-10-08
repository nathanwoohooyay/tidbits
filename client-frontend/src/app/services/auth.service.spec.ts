import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';

describe('AuthService error handling', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });

    service = TestBed.inject(AuthService);
  });

  it('prefers a backend login error message when one is provided', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: { error: 'Account is locked.' },
    });

    expect(service.getLoginErrorMessage(error)).toBe('Account is locked.');
  });

  it('returns a network error message for login when the server cannot be reached', () => {
    const error = new HttpErrorResponse({
      status: 0,
      error: new ProgressEvent('error'),
    });

    expect(service.getLoginErrorMessage(error)).toBe('Unable to reach the server. Check your connection and try again.');
  });

  it('returns a default invalid-credentials message for login 401 responses without a backend message', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: {},
    });

    expect(service.getLoginErrorMessage(error)).toBe('Invalid username or password.');
  });

  it('normalizes a backend invalid-credentials login message', () => {
    const error = new HttpErrorResponse({
      status: 401,
      error: { message: 'invalid username or password' },
    });

    expect(service.getLoginErrorMessage(error)).toBe('Invalid username or password.');
  });

  it('returns an account-exists message for signup conflicts without a backend message', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: {},
    });

    expect(service.getSignupErrorMessage(error)).toBe('An account with those details already exists.');
  });

  it('returns a field-specific signup validation message when the backend provides an error code', () => {
    const error = new HttpErrorResponse({
      status: 422,
      error: {
        errorCode: 'INVALID_EMAIL',
        message: 'enter a valid email address',
      },
    });

    expect(service.getSignupErrorMessage(error)).toBe('Enter a valid email address.');
    expect(service.getSignupFieldErrors(error)).toEqual({
      email: 'Enter a valid email address.',
    });
  });

  it('maps signup conflict codes to the appropriate field errors', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: {
        errorCode: 'PHONE_NUMBER_ALREADY_EXISTS',
        message: 'phone number already exists',
      },
    });

    expect(service.getSignupFieldErrors(error)).toEqual({
      phoneNumber: 'That phone number is already registered.',
    });
  });

  it('returns a service-unavailable message for signup server failures', () => {
    const error = new HttpErrorResponse({
      status: 503,
      error: {},
    });

    expect(service.getSignupErrorMessage(error)).toBe('The service is temporarily unavailable. Please try again shortly.');
  });
});


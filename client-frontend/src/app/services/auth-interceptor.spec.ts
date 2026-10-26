import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { QueryClient } from '@tanstack/angular-query-experimental';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authInterceptor } from './auth-interceptor';
import { SessionService } from './session.service';

// An unsigned token with a subject and expiry, enough for the session to read.
const token = (name: string) => {
  const part = (value: object) => btoa(JSON.stringify(value)).replace(/=+$/, '');
  return `${part({ alg: 'HS256' })}.${part({ sub: '7', exp: Math.floor(Date.now() / 1000) + 900, name })}.sig`;
};

describe('authInterceptor', () => {
  let http: HttpClient;
  let backend: HttpTestingController;
  let session: SessionService;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: QueryClient, useValue: new QueryClient() },
      ],
    });
    http = TestBed.inject(HttpClient);
    backend = TestBed.inject(HttpTestingController);
    session = TestBed.inject(SessionService);
    router = TestBed.inject(Router);
    session.setAuthToken(token('old'));
  });

  it('adds the access token', () => {
    http.get('/api/users/7').subscribe();

    expect(backend.expectOne('/api/users/7').request.headers.get('Authorization')).toBe(`Bearer ${token('old')}`);
  });

  it('renews an expired token once and retries the request', () => {
    let body: unknown;
    http.get('/api/users/7').subscribe(value => (body = value));

    backend.expectOne('/api/users/7').flush(null, { status: 401, statusText: 'Unauthorized' });
    const refresh = backend.expectOne('/api/auth/refresh');
    expect(refresh.request.withCredentials).toBe(true);
    refresh.flush({ accessToken: token('new') });

    const retried = backend.expectOne('/api/users/7');
    expect(retried.request.headers.get('Authorization')).toBe(`Bearer ${token('new')}`);
    retried.flush({ userId: 7 });

    expect(body).toEqual({ userId: 7 });
    expect(session.getAuthToken()).toBe(token('new'));
  });

  it('shares one refresh between requests that fail together', () => {
    http.get('/api/a').subscribe();
    http.get('/api/b').subscribe();

    backend.expectOne('/api/a').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/b').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/refresh').flush({ accessToken: token('new') });

    backend.expectOne('/api/a').flush({});
    backend.expectOne('/api/b').flush({});
    backend.verify();
  });

  it('ends the session when the refresh cookie is no good', () => {
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    let failed = false;
    http.get('/api/users/7').subscribe({ error: () => (failed = true) });

    backend.expectOne('/api/users/7').flush(null, { status: 401, statusText: 'Unauthorized' });
    backend.expectOne('/api/auth/refresh').flush({ error: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    expect(failed).toBe(true);
    expect(session.getAuthToken()).toBeNull();
    expect(navigate).toHaveBeenCalledWith('/login');
  });

  it('sends the token to signed-in auth endpoints but not to sign-in itself', () => {
    http.get('/api/auth/sessions').subscribe();
    http.post('/api/auth/login', {}).subscribe();

    expect(backend.expectOne('/api/auth/sessions').request.headers.get('Authorization')).toBe(`Bearer ${token('old')}`);
    expect(backend.expectOne('/api/auth/login').request.headers.has('Authorization')).toBe(false);
  });

    it('leaves other errors alone', () => {
    let status = 0;
    http.get('/api/users/7').subscribe({ error: err => (status = err.status) });

    backend.expectOne('/api/users/7').flush(null, { status: 500, statusText: 'Server Error' });

    expect(status).toBe(500);
    backend.verify();
  });
});

import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { queryOptions } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

export interface SessionDto {
  sessionId: number;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  // The session making the request (this browser).
  current: boolean;
}

// The devices signed in to the user's account, from the auth service.
@Injectable({ providedIn: 'root' })
export class SessionsService {
  private readonly http = inject(HttpClient);
  private readonly authBase = '/api/auth';

  list() {
    return queryOptions({
      queryKey: ['sessions'] as const,
      queryFn: async () => (await lastValueFrom(this.http.get<{ sessions: SessionDto[] }>(`${this.authBase}/sessions`))).sessions,
    });
  }

  // Ends every session except this one. Resolves to how many were ended.
  async signOutOthers(): Promise<number> {
    const res = await lastValueFrom(this.http.post<{ signedOut: number }>(`${this.authBase}/sessions/sign-out-others`, {}));
    return res.signedOut;
  }
}

export interface DeviceDescription {
  label: string;
  mobile: boolean;
}

// "Chrome on macOS", "Safari on iOS"… from a user agent string; good enough to recognise your own devices.
export function describeDevice(userAgent: string | null): DeviceDescription {
  if (!userAgent) {
    return { label: 'Unknown device', mobile: false };
  }
  const ua = userAgent;
  const browser = /Edg\//.test(ua) ? 'Edge'
    : /OPR\/|Opera/.test(ua) ? 'Opera'
    : /Firefox\//.test(ua) ? 'Firefox'
    : /Chrome\/|CriOS\//.test(ua) ? 'Chrome'
    : /Safari\//.test(ua) && /Version\//.test(ua) ? 'Safari'
    : null;
  const os = /iPhone/.test(ua) ? 'iOS'
    : /iPad/.test(ua) ? 'iPadOS'
    : /Android/.test(ua) ? 'Android'
    : /CrOS/.test(ua) ? 'ChromeOS'
    : /Windows NT/.test(ua) ? 'Windows'
    : /Mac OS X|Macintosh/.test(ua) ? 'macOS'
    : /Linux/.test(ua) ? 'Linux'
    : null;
  const mobile = /Mobi|iPhone|Android/.test(ua);
  const label = browser && os ? `${browser} on ${os}` : browser ?? os ?? 'Unknown device';
  return { label, mobile };
}

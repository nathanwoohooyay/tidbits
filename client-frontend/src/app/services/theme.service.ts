import { Injectable, signal } from '@angular/core';
import { ThemeMode } from '../components/dashboard/dashboard.models';

// Single owner of the light/dark preference so every route, including login and
// the account pages, applies the stored theme on load instead of each page doing it.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly storageKey = 'tidbits_theme_mode';

  readonly mode = signal<ThemeMode>(this.readStoredMode());

  constructor() {
    this.apply(this.mode());
  }

  toggle() {
    this.apply(this.mode() === 'dark' ? 'light' : 'dark');
  }

  private apply(mode: ThemeMode) {
    this.mode.set(mode);
    document.body.classList.toggle('dark-mode', mode === 'dark');
    try {
      localStorage.setItem(this.storageKey, mode);
    } catch {
      // Storage unavailable; the theme still applies for this session.
    }
  }

  private readStoredMode(): ThemeMode {
    try {
      return localStorage.getItem(this.storageKey) === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  }
}

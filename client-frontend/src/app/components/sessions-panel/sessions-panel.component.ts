import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { QueryClient, injectQuery } from '@tanstack/angular-query-experimental';
import { SessionDto, SessionsService, describeDevice } from '../../services/sessions.service';
import { ToastService } from '../../services/toast.service';

const RELATIVE = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

// "just now", "5 minutes ago", "3 days ago".
function ago(iso: string): string {
  const seconds = Math.round((Date.parse(iso) - Date.now()) / 1000);
  const abs = Math.abs(seconds);
  if (abs < 60) {
    return 'just now';
  }
  if (abs < 3600) {
    return RELATIVE.format(Math.round(seconds / 60), 'minute');
  }
  if (abs < 86_400) {
    return RELATIVE.format(Math.round(seconds / 3600), 'hour');
  }
  return RELATIVE.format(Math.round(seconds / 86_400), 'day');
}

// Settings section listing the devices signed in to the account (this one first), with a way to sign out of all the
// others at once. They lose access straight away; this browser stays signed in.
@Component({
  selector: 'app-sessions-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sessions-panel.component.html',
  styleUrl: './sessions-panel.component.css',
})
export class SessionsPanelComponent {
  private readonly sessionsApi = inject(SessionsService);
  private readonly queryClient = inject(QueryClient);
  private readonly toasts = inject(ToastService);

  readonly describeDevice = describeDevice;
  readonly ago = ago;

  private readonly sessionsQuery = injectQuery(() => this.sessionsApi.list());
  readonly loading = computed(() => this.sessionsQuery.isPending());
  readonly error = computed(() => this.sessionsQuery.isError() && !this.sessionsQuery.data());
  // This device first, then by most recent activity.
  readonly sessions = computed<SessionDto[]>(() =>
    [...(this.sessionsQuery.data() ?? [])].sort((a, b) =>
      Number(b.current) - Number(a.current) || Date.parse(b.lastUsedAt) - Date.parse(a.lastUsedAt)));
  readonly otherCount = computed(() => this.sessions().filter(s => !s.current).length);

  readonly confirming = signal(false);
  readonly signingOut = signal(false);
  readonly actionError = signal('');

  askToSignOutOthers() {
    this.actionError.set('');
    this.confirming.set(true);
  }

  cancel() {
    this.confirming.set(false);
  }

  async signOutOthers() {
    this.signingOut.set(true);
    this.actionError.set('');
    try {
      const count = await this.sessionsApi.signOutOthers();
      this.confirming.set(false);
      this.toasts.show({
        kind: 'success',
        title: count === 1 ? 'Signed out of 1 other device' : `Signed out of ${count} other devices`,
        message: 'They\'ll need to sign in again. You\'re still signed in here.',
      });
    } catch (err) {
      const e = err as { error?: { message?: string } };
      this.actionError.set(e?.error?.message ?? 'Couldn\'t sign out of other devices. Please try again.');
    } finally {
      this.signingOut.set(false);
      void this.queryClient.invalidateQueries({ queryKey: this.sessionsApi.list().queryKey });
    }
  }

  retry() {
    void this.sessionsQuery.refetch();
  }
}

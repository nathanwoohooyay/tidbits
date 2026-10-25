import { Injectable, signal } from '@angular/core';

export type ToastKind = 'buy' | 'sell' | 'success' | 'error';

export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
  // Shows the stock's logo instead of an icon (trade confirmations).
  ticker?: string;
  durationMs: number;
  leaving: boolean;
}

const MAX_VISIBLE = 3;
const LEAVE_MS = 220; // matches the toast exit animation

interface Timer {
  handle: ReturnType<typeof setTimeout> | null;
  remaining: number;
  startedAt: number;
}

// Short-lived notifications stacked in the corner. Each closes itself after a few seconds; hovering pauses it.
@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);

  private nextId = 1;
  private readonly timers = new Map<number, Timer>();

  show(toast: { kind: ToastKind; title: string; message?: string; ticker?: string }, durationMs = 5000): number {
    const id = this.nextId++;
    this.toasts.update(list => [...list, { ...toast, id, durationMs, leaving: false }]);
    this.timers.set(id, { handle: null, remaining: durationMs, startedAt: 0 });
    this.resume(id);

    const visible = this.toasts().filter(t => !t.leaving);
    for (const extra of visible.slice(0, Math.max(0, visible.length - MAX_VISIBLE))) {
      this.dismiss(extra.id);
    }
    return id;
  }

  dismiss(id: number) {
    const timer = this.timers.get(id);
    if (timer?.handle) {
      clearTimeout(timer.handle);
    }
    this.timers.delete(id);
    this.toasts.update(list => list.map(t => t.id === id ? { ...t, leaving: true } : t));
    setTimeout(() => this.toasts.update(list => list.filter(t => t.id !== id)), LEAVE_MS);
  }

  pause(id: number) {
    const timer = this.timers.get(id);
    if (timer?.handle) {
      clearTimeout(timer.handle);
      timer.handle = null;
      timer.remaining -= performance.now() - timer.startedAt;
    }
  }

  resume(id: number) {
    const timer = this.timers.get(id);
    if (timer && !timer.handle) {
      timer.startedAt = performance.now();
      timer.handle = setTimeout(() => this.dismiss(id), Math.max(timer.remaining, 0));
    }
  }
}

import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, effect, input, output, signal, untracked, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { formatCurrency } from './dashboard.utils';
import { MODAL_EXIT_MS, lockPageScroll, unlockPageScroll } from './page-scroll-lock';

// How long the Transfer button shows its check mark before the window closes and the toast appears.
export const TRANSFER_DONE_MS = 600;

// The toast confirming a finished deposit or withdrawal.
export function transferToast(direction: 'deposit' | 'withdraw', amount: number, accountName: string) {
  return {
    kind: 'success' as const,
    title: `${direction === 'deposit' ? 'Deposited' : 'Withdrew'} ${formatCurrency(amount)}`,
    message: `${direction === 'deposit' ? 'Added to' : 'Taken from'} ${accountName || 'your account'}`,
  };
}

// "Transfer" pop-up: deposit to or withdraw from the selected account.
@Component({
  selector: 'app-dashboard-cash-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-cash-modal.component.html',
  styleUrl: './dashboard-cash-modal.component.css'
})
export class DashboardCashModalComponent implements OnDestroy {
  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('dialog');

  readonly open = input(false);
  readonly accountName = input('');
  readonly cashBalance = input(0);
  readonly cashAmount = input<number | null>(null);
  readonly cashLoading = input(false);
  readonly cashError = input('');
  readonly cashSuccess = input('');

  readonly closed = output<void>();
  readonly cashAmountChange = output<number | null>();
  readonly deposit = output<void>();
  readonly withdraw = output<void>();

  readonly formatCurrency = formatCurrency;
  readonly direction = signal<'deposit' | 'withdraw'>('deposit');
  // Content stays rendered briefly after `open` turns false, so it doesn't vanish mid-animation.
  readonly rendered = signal(false);

  private previousFocus: HTMLElement | null = null;
  private scrollLocked = false;
  private unrenderTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const open = this.open();
      untracked(() => open ? this.show() : this.hide());
    });
  }

  ngOnDestroy() {
    this.releaseScroll();
  }

  setDirection(direction: 'deposit' | 'withdraw') {
    this.direction.set(direction);
  }

  submit() {
    if (this.direction() === 'deposit') {
      this.deposit.emit();
    } else {
      this.withdraw.emit();
    }
  }

  onDialogClick(event: MouseEvent) {
    if (event.target === this.dialog()?.nativeElement) {
      this.closed.emit();
    }
  }

  onCancel(event: Event) {
    event.preventDefault();
    this.closed.emit();
  }

  private show() {
    const dialog = this.dialog()?.nativeElement;
    if (dialog && !dialog.open) {
      if (this.unrenderTimer) {
        clearTimeout(this.unrenderTimer);
        this.unrenderTimer = null;
      }
      this.rendered.set(true);
      this.previousFocus = document.activeElement as HTMLElement | null;
      this.direction.set('deposit');
      lockPageScroll();
      this.scrollLocked = true;
      dialog.showModal();
    }
  }

  private hide() {
    const dialog = this.dialog()?.nativeElement;
    if (dialog?.open) {
      dialog.close();
      this.unrenderTimer = setTimeout(() => this.rendered.set(false), MODAL_EXIT_MS);
    }
    this.releaseScroll();
    this.previousFocus?.focus();
    this.previousFocus = null;
  }

  private releaseScroll() {
    if (this.scrollLocked) {
      unlockPageScroll();
      this.scrollLocked = false;
    }
  }
}

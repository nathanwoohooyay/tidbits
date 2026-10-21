import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard-cash-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-cash-panel.component.html',
  styleUrl: './dashboard-cash-panel.component.css'
})
export class DashboardCashPanelComponent {
  @Input() selectedAccountId = 0;
  @Input() cashBalance = 0;
  @Input() cashAmount: number | null = null;
  @Input() cashLoading = false;
  @Input() cashError = '';
  @Input() cashSuccess = '';

  @Output() cashAmountChange = new EventEmitter<number | null>();
  @Output() deposit = new EventEmitter<void>();
  @Output() withdraw = new EventEmitter<void>();
}
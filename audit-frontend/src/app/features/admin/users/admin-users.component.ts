import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser, AdminAccount } from '../../../core/models/models';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="users-container animate-fade-in">
      <div class="page-header">
        <div>
          <div class="badge badge-admin">USER GOVERNANCE</div>
          <h1 class="page-title">User & Role Management</h1>
          <p class="page-subtitle">Inspect registered accounts, reassign role permissions, and execute session revocations</p>
        </div>
        <div class="header-actions">
          <button id="btn-refresh-users" class="btn btn-secondary btn-sm" (click)="loadUsers()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Refresh Users</span>
          </button>
        </div>
      </div>

      <!-- Toast Feedback Message -->
      <div *ngIf="toastMessage()" class="toast-banner glass-panel animate-fade-in" [ngClass]="toastType()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>{{ toastMessage() }}</span>
        <button class="toast-close" (click)="toastMessage.set(null)">✕</button>
      </div>

      <!-- Filter Controls -->
      <div class="filter-card glass-panel">
        <div class="search-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            id="input-user-search"
            type="text"
            class="input-control search-input"
            placeholder="Search by username, email, or user ID..."
            [(ngModel)]="searchQuery"
          />
        </div>

        <div class="role-filter-group">
          <label>Filter Role:</label>
          <select class="input-control select-role" [(ngModel)]="roleFilter">
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="AUDITOR">AUDITOR</option>
            <option value="USER">USER</option>
          </select>
        </div>
      </div>

      <!-- Users Table -->
      <div class="table-card glass-panel">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>User ID</th>
                <th>Username</th>
                <th>Email Address</th>
                <th>Contact Phone</th>
                <th>Reward Points</th>
                <th>Assigned Role</th>
                <th>Member Since</th>
                <th style="text-align: right;">Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of filteredUsers()">
                <td class="mono-font">#{{ user.userId }}</td>
                <td>
                  <span class="user-name-cell">{{ user.username }}</span>
                </td>
                <td class="text-secondary">{{ user.email || '—' }}</td>
                <td class="mono-font text-secondary">{{ user.phone || '—' }}</td>
                <td class="mono-font text-emerald">{{ (user.rewardPoints || 0) | number }} pts</td>
                <td>
                  <span class="badge" [ngClass]="getRoleBadgeClass(user.role)">
                    {{ user.role }}
                  </span>
                </td>
                <td class="mono-font text-muted">{{ user.createdAt | date:'mediumDate' }}</td>
                <td style="text-align: right;">
                  <div class="row-actions">
                    <button
                      [id]="'btn-accounts-' + user.userId"
                      class="btn btn-secondary btn-sm"
                      (click)="viewAccounts(user)"
                      title="Inspect user financial accounts"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                      </svg>
                      <span>Accounts</span>
                    </button>

                    <button
                      [id]="'btn-role-' + user.userId"
                      class="btn btn-secondary btn-sm"
                      (click)="openRoleModal(user)"
                      title="Modify assigned security role"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                      </svg>
                      <span>Role</span>
                    </button>

                    <button
                      [id]="'btn-revoke-' + user.userId"
                      class="btn btn-danger btn-sm"
                      (click)="confirmRevoke(user)"
                      title="Invalidate all active JWT tokens"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                        <line x1="12" y1="2" x2="12" y2="12"></line>
                      </svg>
                      <span>Revoke</span>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="filteredUsers().length === 0">
                <td colspan="8" class="empty-cell">No users found matching search criteria.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Accounts Drawer / Modal -->
      <div *ngIf="selectedUserForAccounts()" class="modal-backdrop animate-fade-in" (click)="closeAccountsModal()">
        <div class="modal-card glass-panel" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="badge badge-admin">ACCOUNT DOSSIER</div>
              <h2 class="modal-title">Accounts: {{ selectedUserForAccounts()?.username }}</h2>
              <span class="modal-sub">User ID #{{ selectedUserForAccounts()?.userId }}</span>
            </div>
            <button class="modal-close" (click)="closeAccountsModal()">✕</button>
          </div>

          <div class="modal-body">
            <div *ngIf="loadingAccounts()" class="loading-state">
              <span>Retrieving account ledger...</span>
            </div>

            <div *ngIf="!loadingAccounts()" class="accounts-list">
              <div *ngFor="let acc of userAccounts()" class="account-item">
                <div class="acc-top">
                  <span class="acc-id mono-font">ACC #{{ acc.accountId }}</span>
                  <span class="badge badge-success">ACTIVE</span>
                </div>
                <div class="acc-name">{{ acc.nickname || 'Standard Custody Account' }}</div>
                <div class="acc-balance">
                  <span class="bal-label">Cash Balance:</span>
                  <span class="bal-val mono-font text-emerald">\${{ acc.cashBalance | number:'1.2-2' }}</span>
                </div>
                <div class="acc-date text-muted mono-font">Opened: {{ acc.createdAt | date:'mediumDate' }}</div>
              </div>

              <div *ngIf="userAccounts().length === 0" class="empty-cell">
                No accounts currently registered for this user.
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAccountsModal()">Close Dossier</button>
          </div>
        </div>
      </div>

      <!-- Role Change Modal -->
      <div *ngIf="selectedUserForRole()" class="modal-backdrop animate-fade-in" (click)="closeRoleModal()">
        <div class="modal-card glass-panel modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Modify Security Role</h2>
              <span class="modal-sub">User: {{ selectedUserForRole()?.username }} (#{{ selectedUserForRole()?.userId }})</span>
            </div>
            <button class="modal-close" (click)="closeRoleModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Select Authorization Tier:</label>
              <select class="input-control" [(ngModel)]="newRoleSelection">
                <option value="USER">USER (Standard Trader)</option>
                <option value="AUDITOR">AUDITOR (Compliance & Surveillance)</option>
                <option value="ADMIN">ADMIN (Full Administrative Control)</option>
              </select>
            </div>
            <p class="role-warning">
              Updating the user role updates the permissions stored in the database. When the user logs in, their new JWT will reflect these permissions.
            </p>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeRoleModal()">Cancel</button>
            <button
              id="btn-confirm-role"
              class="btn btn-primary"
              [disabled]="updatingRole()"
              (click)="saveRoleChange()"
            >
              <span *ngIf="!updatingRole()">Apply Role Change</span>
              <span *ngIf="updatingRole()">Updating...</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Revoke Confirmation Modal -->
      <div *ngIf="selectedUserForRevoke()" class="modal-backdrop animate-fade-in" (click)="closeRevokeModal()">
        <div class="modal-card glass-panel modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <div class="badge badge-danger">SECURITY ENFORCEMENT</div>
              <h2 class="modal-title">Confirm Access Revocation</h2>
            </div>
            <button class="modal-close" (click)="closeRevokeModal()">✕</button>
          </div>

          <div class="modal-body">
            <p class="revoke-confirm-text">
              Are you sure you want to immediately revoke all access for <strong>{{ selectedUserForRevoke()?.username }}</strong> (User #{{ selectedUserForRevoke()?.userId }})?
            </p>
            <div class="revoke-consequences">
              <ul>
                <li>Increments token_version in user_roles table</li>
                <li>Immediately rejects all existing JWT tokens</li>
                <li>Forces immediate logout across all active browser sessions</li>
              </ul>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeRevokeModal()">Cancel</button>
            <button
              id="btn-confirm-revoke"
              class="btn btn-danger"
              [disabled]="revoking()"
              (click)="executeRevoke()"
            >
              <span *ngIf="!revoking()">Confirm Revocation</span>
              <span *ngIf="revoking()">Revoking...</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .users-container {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .page-title {
      font-size: 24px;
      font-weight: 800;
      color: var(--text-primary);
      margin-top: 6px;
    }

    .page-subtitle {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .toast-banner {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 18px;
      border-radius: var(--radius-md);
      font-size: 13.5px;
      font-weight: 600;
    }

    .toast-banner.success {
      background: rgba(42, 97, 66, 0.12);
      border: 1px solid rgba(42, 97, 66, 0.35);
      color: #2a6142;
    }

    .toast-banner.danger {
      background: rgba(163, 50, 36, 0.12);
      border: 1px solid rgba(163, 50, 36, 0.35);
      color: #a33224;
    }

    .toast-close {
      margin-left: auto;
      background: transparent;
      border: none;
      color: inherit;
      cursor: pointer;
      font-size: 16px;
    }

    .filter-card {
      padding: 14px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .search-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 2px 12px;
      flex: 1;
      max-width: 440px;
    }

    .search-wrap svg {
      color: var(--text-muted);
    }

    .search-input {
      border: none;
      background: transparent;
      padding: 8px 0;
    }

    .search-input:focus {
      box-shadow: none;
    }

    .role-filter-group {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 12px;
      color: var(--text-muted);
      font-weight: 700;
      text-transform: uppercase;
    }

    .select-role {
      width: auto;
      padding: 6px 12px;
      font-size: 12.5px;
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .user-name-cell {
      font-weight: 700;
      color: var(--text-primary);
    }

    .text-secondary { color: var(--text-secondary); }
    .text-emerald { color: #2a6142; }
    .text-muted { color: var(--text-muted); }

    .row-actions {
      display: flex;
      justify-content: flex-end;
      gap: 6px;
    }

    /* Modal Styling */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(40, 22, 13, 0.65);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .modal-card {
      width: 100%;
      max-width: 600px;
      background: #fffdf9;
      border: 1px solid rgba(62, 36, 21, 0.2);
      border-radius: var(--radius-lg);
      box-shadow: var(--shadow-lg);
      padding: 26px;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .modal-card.modal-sm {
      max-width: 460px;
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 16px;
    }

    .modal-title {
      font-size: 18px;
      font-weight: 800;
      color: var(--text-primary);
      margin-top: 4px;
    }

    .modal-sub {
      font-size: 12px;
      color: var(--text-muted);
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 20px;
      cursor: pointer;
    }

    .modal-close:hover {
      color: var(--text-primary);
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      border-top: 1px solid var(--border-subtle);
      padding-top: 16px;
    }

    .accounts-list {
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      max-height: 380px;
      overflow-y: auto;
    }

    .account-item {
      background: #faf6ee;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .acc-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .acc-id {
      font-size: 12px;
      font-weight: 700;
      color: var(--accent-cognac);
    }

    .acc-name {
      font-size: 14px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .acc-balance {
      display: flex;
      justify-content: space-between;
      margin-top: 4px;
      padding-top: 6px;
      border-top: 1px dashed rgba(62, 36, 21, 0.12);
    }

    .bal-label {
      font-size: 12px;
      color: var(--text-muted);
    }

    .bal-val {
      font-size: 15px;
      font-weight: 700;
    }

    .role-warning {
      font-size: 12px;
      color: var(--text-secondary);
      line-height: 1.4;
      background: #faf6ee;
      border: 1px solid var(--border-subtle);
      padding: 10px;
      border-radius: var(--radius-sm);
    }

    .revoke-confirm-text {
      font-size: 14px;
      color: var(--text-primary);
      line-height: 1.5;
    }

    .revoke-consequences {
      background: rgba(163, 50, 36, 0.08);
      border: 1px solid rgba(163, 50, 36, 0.25);
      border-radius: var(--radius-sm);
      padding: 12px 16px;
    }

    .revoke-consequences ul {
      margin-left: 18px;
      font-size: 12px;
      color: #8c2417;
    }

    .empty-cell {
      text-align: center;
      padding: 30px;
      color: var(--text-muted);
    }
  `]
})
export class AdminUsersComponent implements OnInit {
  users = signal<AdminUser[]>([]);
  searchQuery = '';
  roleFilter = 'ALL';

  // Modals state
  selectedUserForAccounts = signal<AdminUser | null>(null);
  userAccounts = signal<AdminAccount[]>([]);
  loadingAccounts = signal(false);

  selectedUserForRole = signal<AdminUser | null>(null);
  newRoleSelection = 'USER';
  updatingRole = signal(false);

  selectedUserForRevoke = signal<AdminUser | null>(null);
  revoking = signal(false);

  // Toast
  toastMessage = signal<string | null>(null);
  toastType = signal<'success' | 'danger'>('success');

  filteredUsers = computed(() => {
    let list = this.users();
    const query = this.searchQuery.toLowerCase().trim();
    const role = this.roleFilter;

    if (query) {
      list = list.filter(u =>
        u.username.toLowerCase().includes(query) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        u.userId.toString() === query
      );
    }

    if (role !== 'ALL') {
      list = list.filter(u => u.role === role);
    }

    return list;
  });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe(users => {
      this.users.set(users);
    });
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'ADMIN') return 'badge-admin';
    if (role === 'AUDITOR') return 'badge-auditor';
    return 'badge-user';
  }

  // View accounts
  viewAccounts(user: AdminUser) {
    this.selectedUserForAccounts.set(user);
    this.loadingAccounts.set(true);
    this.adminService.getUserAccounts(user.userId).subscribe(accounts => {
      this.userAccounts.set(accounts);
      this.loadingAccounts.set(false);
    });
  }

  closeAccountsModal() {
    this.selectedUserForAccounts.set(null);
    this.userAccounts.set([]);
  }

  // Change role
  openRoleModal(user: AdminUser) {
    this.selectedUserForRole.set(user);
    this.newRoleSelection = user.role || 'USER';
  }

  closeRoleModal() {
    this.selectedUserForRole.set(null);
  }

  saveRoleChange() {
    const user = this.selectedUserForRole();
    if (!user) return;

    this.updatingRole.set(true);
    this.adminService.updateUserRole(user.userId, this.newRoleSelection).subscribe({
      next: () => {
        this.updatingRole.set(false);
        user.role = this.newRoleSelection;
        this.showToast(`Successfully assigned role ${this.newRoleSelection} to user #${user.userId} (${user.username}).`, 'success');
        this.closeRoleModal();
      },
      error: () => {
        this.updatingRole.set(false);
        this.showToast(`Failed to assign role ${this.newRoleSelection} to user #${user.userId} (${user.username}). Please try again.`, 'danger');
      }
    });
  }

  // Revoke access
  confirmRevoke(user: AdminUser) {
    this.selectedUserForRevoke.set(user);
  }

  closeRevokeModal() {
    this.selectedUserForRevoke.set(null);
  }

  executeRevoke() {
    const user = this.selectedUserForRevoke();
    if (!user) return;

    this.revoking.set(true);
    this.adminService.revokeUserAccess(user.userId).subscribe({
      next: () => {
        this.revoking.set(false);
        this.showToast(`Access revoked for ${user.username}. Active sessions terminated and token_version incremented.`, 'danger');
        this.closeRevokeModal();
      },
      error: () => {
        this.revoking.set(false);
        this.showToast(`Failed to revoke access for ${user.username}. Please try again.`, 'danger');
      }
    });
  }

  private showToast(msg: string, type: 'success' | 'danger') {
    this.toastMessage.set(msg);
    this.toastType.set(type);
    setTimeout(() => {
      this.toastMessage.set(null);
    }, 4500);
  }
}

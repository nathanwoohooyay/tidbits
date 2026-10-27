import { Component, HostListener, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of, switchMap } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import { AdminUser, AdminAccount, RoleDefinition } from '../../../core/models/models';
import { PhoneFormatPipe } from '../pipes/phoneformat.pipe';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, PhoneFormatPipe],
  template: `
    <div class="users-container animate-fade-in">
      <div class="page-header">
        <div>
          <h1 class="page-title">Users and roles</h1>
        </div>
        <div class="header-actions">
          <button id="btn-refresh-users" class="btn btn-secondary btn-sm" (click)="loadUsers()">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            <span>Refresh</span>
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
            placeholder="Search by username, email or user ID…"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
          />
        </div>

        <div class="role-filter-group">
          <label>Role</label>
          <select
            class="input-control select-role"
            [ngModel]="roleFilter()"
            (ngModelChange)="roleFilter.set($event)"
          >
            <option value="ALL">All roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="AUDITOR">AUDITOR</option>
            <option value="REPORTER">REPORTER</option>
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
                <th>Email</th>
                <th>Phone</th>
                <th>Reward points</th>
                <th>Role</th>
                <th>Member since</th>
                <th style="text-align: right;">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let user of filteredUsers()">
                <td class="mono-font">#{{ user.userId }}</td>
                <td>
                  <span class="user-name-cell">{{ user.username }}</span>
                </td>
                <td class="text-secondary">{{ user.email || '—' }}</td>
                <td class="mono-font text-secondary">{{ (user.phoneNumber | phoneFormat) || '—' }}</td>
                <td class="mono-font text-emerald">{{ (user.rewardPoints || 0) | number }} pts</td>
                <td>
                  <span class="badge" [ngClass]="getRoleBadgeClass(getUserRole(user))">
                    {{ getUserRole(user) }}
                  </span>
                </td>
                <td class="mono-font text-muted">{{ user.createdAt | date:'mediumDate' }}</td>
                <td style="text-align: right;">
                  <div class="row-actions">
                    <button
                      [id]="'btn-accounts-' + user.userId"
                      class="btn btn-secondary btn-sm"
                      (click)="viewAccounts(user)"
                      title="View accounts"
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
                      title="Change role"
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
                      title="Sign this user out everywhere"
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
                <td colspan="8" class="empty-cell">No users match your search.</td>
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
              <div class="badge badge-admin">Account details</div>
              <h2 class="modal-title">Accounts: {{ selectedUserForAccounts()?.username }}</h2>
              <span class="modal-sub">User ID #{{ selectedUserForAccounts()?.userId }}</span>
            </div>
            <button class="modal-close" (click)="closeAccountsModal()">✕</button>
          </div>

          <div class="modal-body">
            <div *ngIf="loadingAccounts()" class="loading-state">
              <span>Loading accounts…</span>
            </div>

            <div *ngIf="!loadingAccounts()" class="accounts-list">
              <div *ngFor="let acc of userAccounts()" class="account-item">
                <div class="acc-top">
                  <span class="acc-id mono-font">Account #{{ acc.accountId }}</span>
                </div>
                <div class="acc-name">{{ acc.nickname || 'Unnamed account' }}</div>
                <div class="acc-balance">
                  <span class="bal-label">Cash balance:</span>
                  <span class="bal-val mono-font text-emerald">\${{ acc.cashBalance | number:'1.2-2' }}</span>
                </div>
                <div class="acc-date text-muted mono-font">Opened: {{ acc.createdAt | date:'mediumDate' }}</div>
              </div>

              <div *ngIf="userAccounts().length === 0" class="empty-cell">
                This user has no accounts.
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeAccountsModal()">Close</button>
          </div>
        </div>
      </div>

      <!-- Role Change Modal -->
      <div *ngIf="selectedUserForRole()" class="modal-backdrop animate-fade-in" (click)="closeRoleModal()">
        <div class="modal-card glass-panel modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Change role</h2>
              <span class="modal-sub">User: {{ selectedUserForRole()?.username }} (#{{ selectedUserForRole()?.userId }})</span>
            </div>
            <button class="modal-close" (click)="closeRoleModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label>Role</label>
              <select class="input-control" [(ngModel)]="newRoleSelection">
                <option value="USER">User (trader)</option>
                <option value="AUDITOR">Auditor (compliance)</option>
                <option value="REPORTER">Reporter (read-only reports)</option>
                <option value="ADMIN">Admin (full access)</option>
              </select>
            </div>
            <p class="role-warning">
              The user needs to sign in again for the new role to take effect.
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
              <span *ngIf="!updatingRole()">Change role</span>
              <span *ngIf="updatingRole()">Saving…</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Revoke Confirmation Modal -->
      <div *ngIf="selectedUserForRevoke()" class="modal-backdrop animate-fade-in" (click)="closeRevokeModal()">
        <div class="modal-card glass-panel modal-sm" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <div>
              <h2 class="modal-title">Revoke access?</h2>
            </div>
            <button class="modal-close" (click)="closeRevokeModal()">✕</button>
          </div>

          <div class="modal-body">
            <p class="revoke-confirm-text">
              Are you sure you want to revoke access for <strong>{{ selectedUserForRevoke()?.username }}</strong> (User #{{ selectedUserForRevoke()?.userId }})?
            </p>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeRevokeModal()">Cancel</button>
            <button
              id="btn-confirm-revoke"
              class="btn btn-danger"
              [disabled]="revoking()"
              (click)="executeRevoke()"
            >
              <span *ngIf="!revoking()">Revoke access</span>
              <span *ngIf="revoking()">Revoking…</span>
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
      background: rgba(0, 127, 75, 0.12);
      border: 1px solid rgba(0, 127, 75, 0.35);
      color: #007F4B;
    }

    .toast-banner.danger {
      background: rgba(186, 11, 47, 0.12);
      border: 1px solid rgba(186, 11, 47, 0.35);
      color: #BA0B2F;
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
      background: #F8F3EE;
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
      font-weight: 600;
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
    .text-emerald { color: #007F4B; }
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
      background: rgba(34, 28, 24, 0.65);
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
      background: #F8F3EE;
      border: 1px solid rgba(76, 47, 36, 0.2);
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
      background: #F8F3EE;
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
      border-top: 1px dashed rgba(76, 47, 36, 0.12);
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
      background: #F8F3EE;
      border: 1px solid var(--border-subtle);
      padding: 10px;
      border-radius: var(--radius-sm);
    }

    .revoke-confirm-text {
      font-size: 14px;
      color: var(--text-primary);
      line-height: 1.5;
    }

    .revoke-desc {
      font-size: 12.5px;
      color: var(--text-secondary);
      line-height: 1.5;
      padding: 10px 12px;
      background: #F8F3EE;
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
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
  searchQuery = signal('');
  roleFilter = signal('ALL');

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
    const query = this.searchQuery().toLowerCase().trim();
    const role = this.roleFilter();

    if (query) {
      list = list.filter((u: AdminUser) =>
        u.username.toLowerCase().includes(query) ||
        (u.email && u.email.toLowerCase().includes(query)) ||
        u.userId.toString() === query
      );
    }

    if (role !== 'ALL') {
      list = list.filter((u: AdminUser) => this.getUserRole(u) === role);
    }

    return list;
  });

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getAllUsers().subscribe((users: AdminUser[]) => {
      if (users.length === 0) {
        this.users.set(users);
        return;
      }

      forkJoin(
        users.map((user) =>
          this.adminService.getUserRole(user.userId).pipe(catchError(() => of(null)))
        )
      ).subscribe((roles: Array<RoleDefinition | null>) => {
        this.users.set(
          users.map((user, index) => ({
            ...user,
            role: this.normalizeRoleName(roles[index]?.name),
          }))
        );
      });
    });
  }

  getUserRole(user: AdminUser): string {
    const role = (user.role ?? '')
      .toString()
      .trim()
      .toUpperCase();

    if (!role || role === 'CLIENT') return 'USER';
    return role;
  }

  getRoleBadgeClass(role: string): string {
    if (role === 'ADMIN') return 'badge-admin';
    if (role === 'AUDITOR') return 'badge-auditor';
    if (role === 'REPORTER') return 'badge-reporter';
    return 'badge-user';
  }

  // View accounts
  viewAccounts(user: AdminUser) {
    this.selectedUserForAccounts.set(user);
    this.loadingAccounts.set(true);
    this.adminService.getUserAccounts(user.userId).subscribe((accounts: AdminAccount[]) => {
      this.userAccounts.set(accounts);
      this.loadingAccounts.set(false);
    });
  }

  // Esc closes whichever dialog is open.
  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.selectedUserForRevoke()) {
      this.closeRevokeModal();
    } else if (this.selectedUserForRole()) {
      this.closeRoleModal();
    } else if (this.selectedUserForAccounts()) {
      this.closeAccountsModal();
    }
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
    this.adminService.updateUserRole(user.userId, this.newRoleSelection).pipe(
      switchMap(() => this.adminService.revokeUserAccess(user.userId).pipe(catchError(() => of(null))))
    ).subscribe({
      next: () => {
        this.updatingRole.set(false);
        user.role = this.newRoleSelection;
        this.showToast(`Successfully assigned role ${this.newRoleSelection} to user #${user.userId} (${user.username}). A user has to relogin for the changes to go into place.`, 'success');
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
          this.showToast(`Access revoked for ${user.username}. Active sessions terminated and auth tokens invalidated.`, 'success');
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

  private normalizeRoleName(roleName?: string) {
    if (!roleName) {
      return 'USER';
    }

    const normalized = roleName.trim().toUpperCase();
    return normalized === 'CLIENT' ? 'USER' : normalized;
  }
}

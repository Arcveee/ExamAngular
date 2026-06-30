import { Component, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { RoleService } from '../../core/services/role.service';
import { WalletStateService } from '../../core/services/wallet-state.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, DecimalPipe],
  template: `
    <header class="header">
      <span class="header__title">BadWallet</span>
      <span class="header__balance">
        {{ role() === 'client' ? (balance() | number: '1.0-0') + ' francs' : '—' }}
      </span>
      <button class="header__logout" (click)="changeRole()">Changer de rôle</button>
    </header>
    <main class="main">
      <router-outlet />
    </main>
  `,
  styles: [`
    .header {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.75rem 1.5rem;
      background: #1a237e;
      color: #fff;
    }
    .header__title { font-weight: 700; font-size: 1.2rem; flex: 1; }
    .header__balance { font-size: 1rem; }
    .header__logout {
      padding: 0.25rem 0.75rem;
      cursor: pointer;
      border: 1px solid #fff;
      background: transparent;
      color: #fff;
      border-radius: 4px;
    }
    .main { padding: 1.5rem; }
  `],
})
export class ShellComponent {
  private roleService = inject(RoleService);
  private walletState = inject(WalletStateService);
  private router = inject(Router);

  role = this.roleService.role;
  balance = this.walletState.balance;

  changeRole(): void {
    this.roleService.setRole(null);
    this.router.navigate(['/']);
  }
}

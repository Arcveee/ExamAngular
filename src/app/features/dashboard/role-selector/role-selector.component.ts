import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../core/services/role.service';
import { WalletStateService } from '../../../core/services/wallet-state.service';
import { UserRole } from '../../../core/models/models';

@Component({
  selector: 'app-role-selector',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="selector">
      <h1 class="selector__title">BadWallet</h1>
      <p class="selector__subtitle">Choisissez votre espace</p>

      @if (!pendingClient()) {
        <div class="selector__actions">
          <button class="btn btn--agent" (click)="select('agent')">Agent de guichet</button>
          <button class="btn btn--client" (click)="pendingClient.set(true)">Client final</button>
        </div>
      } @else {
        <div class="selector__phone-form">
          <label for="phone-input" class="selector__label">Votre numéro de téléphone</label>
          <input
            id="phone-input"
            type="tel"
            class="selector__phone-input"
            [(ngModel)]="phoneInput"
            placeholder="Ex: 0612345678"
            (keyup.enter)="confirmClient()"
          />
          <div class="selector__form-actions">
            <button class="btn btn--outline" (click)="pendingClient.set(false)">Retour</button>
            <button class="btn btn--client" [disabled]="!phoneInput()" (click)="confirmClient()">
              Accéder à mon espace
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .selector {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;
    }
    .selector__title { font-size: 2rem; color: #1a237e; margin: 0; }
    .selector__subtitle { color: #555; margin: 0; }
    .selector__actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .selector__phone-form {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
      width: 280px;
    }
    .selector__label { color: #333; font-size: 0.9rem; font-weight: 500; }
    .selector__phone-input {
      padding: 0.6rem 0.75rem;
      font-size: 1rem;
      border: 1px solid #ccc;
      border-radius: 6px;
      outline: none;
    }
    .selector__phone-input:focus { border-color: #00695c; box-shadow: 0 0 0 2px rgba(0,105,92,.2); }
    .selector__form-actions { display: flex; gap: 0.75rem; }
    .btn {
      flex: 1;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn--agent { background: #1a237e; color: #fff; }
    .btn--client { background: #00695c; color: #fff; }
    .btn--outline { background: transparent; border: 1px solid #ccc; color: #333; }
  `],
})
export class RoleSelectorComponent {
  private roleService = inject(RoleService);
  private walletState = inject(WalletStateService);
  private router = inject(Router);

  pendingClient = signal(false);
  phoneInput = signal('');

  select(role: UserRole): void {
    this.roleService.setRole(role);
    this.router.navigate([role === 'agent' ? '/agent' : '/client']);
  }

  confirmClient(): void {
    const phone = this.phoneInput().trim();
    if (!phone) return;
    this.walletState.setPhone(phone);
    this.roleService.setRole('client');
    this.router.navigate(['/client']);
  }
}

import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletApiService } from '../../../core/services/wallet-api.service';

@Component({
  selector: 'app-wallet-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="wallet-create">
      <h3>Nouveau Client</h3>
      <form (submit)="createWallet($event)" class="create-form">
        <div class="form-group">
          <input type="text" [(ngModel)]="ownerName" name="ownerName" placeholder="Prénom" required />
        </div>
        <div class="form-group">
          <input type="tel" [ngModel]="phoneNumber()" (ngModelChange)="onPhoneInput($event)" name="phoneNumber" placeholder="Numéro de téléphone (ex: 77 123 45 67)" required />
        </div>
        <button type="submit" [disabled]="!isValid() || loading()">
          {{ loading() ? 'Création...' : 'Créer le portefeuille' }}
        </button>
      </form>
      @if (successMsg()) {
        <p class="msg-success">{{ successMsg() }}</p>
      }
      @if (errorMsg()) {
        <p class="msg-error">{{ errorMsg() }}</p>
      }
    </div>
  `,
  styles: [`
    .wallet-create { background: #fff; padding: 1.5rem; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,.1); margin-bottom: 2rem; max-width: 900px; }
    h3 { margin-top: 0; color: #1a237e; margin-bottom: 1rem; }
    .create-form { display: flex; gap: 1rem; align-items: flex-start; flex-wrap: wrap; }
    .form-group { display: flex; flex-direction: column; flex: 1; min-width: 200px; }
    input { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
    button { padding: 0.5rem 1.5rem; background: #1a237e; color: #fff; border: none; border-radius: 4px; cursor: pointer; height: 38px; }
    button:disabled { opacity: 0.5; cursor: not-allowed; }
    .msg-success { color: #2e7d32; margin-top: 1rem; font-weight: 500; }
    .msg-error { color: #c62828; margin-top: 1rem; font-weight: 500; }
  `]
})
export class WalletCreateComponent {
  private walletApi = inject(WalletApiService);

  ownerName = signal('');
  phoneNumber = signal('');
  loading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');

  onPhoneInput(value: string): void {
    const clean = value.replace(/\D/g, '').substring(0, 9);
    let formatted = '';
    if (clean.length > 0) formatted = clean.substring(0, 2);
    if (clean.length > 2) formatted += ' ' + clean.substring(2, 5);
    if (clean.length > 5) formatted += ' ' + clean.substring(5, 7);
    if (clean.length > 7) formatted += ' ' + clean.substring(7, 9);
    this.phoneNumber.set(formatted);
  }

  isValid(): boolean {
    return this.ownerName().trim().length > 0 && this.phoneNumber().replace(/\s/g, '').length === 9;
  }

  createWallet(event: Event): void {
    event.preventDefault();
    if (!this.isValid()) return;

    this.loading.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    const phone = this.phoneNumber().replace(/\s/g, '');

    this.walletApi.create('+221' + phone, this.ownerName().trim()).subscribe({
      next: (wallet) => {
        this.successMsg.set(`Portefeuille créé avec succès pour ${wallet.ownerName}. Numéro: ${wallet.phoneNumber}`);
        this.ownerName.set('');
        this.phoneNumber.set('');
        this.loading.set(false);
      },
      error: (err) => {
        this.errorMsg.set(err.error?.message || 'Erreur lors de la création du portefeuille. Vérifiez si le numéro existe déjà.');
        this.loading.set(false);
      }
    });
  }
}

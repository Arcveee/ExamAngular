import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { Wallet } from '../../../core/models/models';

@Component({
  selector: 'app-wallet-search',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  template: `
    <div class="wallet-search">
      <div class="search-bar">
        <input 
          type="tel" 
          [ngModel]="phoneNumber()"
          (ngModelChange)="onPhoneInput($event)"
          placeholder="Ex: 77 123 43 32"
          (keyup.enter)="search()"
        />
        <button (click)="search()" [disabled]="!phoneNumber() || loading()">Rechercher</button>
      </div>

      @if (loading()) {
        <p class="state-msg">Recherche en cours…</p>
      } @else if (error()) {
        <p class="state-msg state-msg--error">Aucun portefeuille trouvé</p>
      } @else if (wallet()) {
        <div class="wallet-details">
          <h3>Détails du portefeuille</h3>
          <p><strong>Solde :</strong> {{ wallet()?.balance | number:'1.2-2' }} {{ wallet()?.devise }}</p>
          <p><strong>Code :</strong> {{ wallet()?.code }}</p>
          <p><strong>Date de création :</strong> {{ wallet()?.createdAt | date:'dd/MM/yyyy' }}</p>
        </div>

        <div class="operations">
          @if (operationError()) {
            <p class="operation-error">{{ operationError() }}</p>
          }

          <div class="operation-form">
            <h4>Dépôt</h4>
            <input type="number" [(ngModel)]="depositAmount" placeholder="Montant" />
            <select [(ngModel)]="depositMethod">
              <option value="CREDIT_CARD">Carte de crédit</option>
              <option value="WALLET_TARGET">Wallet Target</option>
            </select>
            <button (click)="deposit()" [disabled]="!depositAmount() || !depositMethod() || operationLoading()">
              Déposer
            </button>
          </div>

          <div class="operation-form">
            <h4>Retrait</h4>
            <input type="number" [(ngModel)]="withdrawAmount" placeholder="Montant" />
            <button (click)="withdraw()" [disabled]="!withdrawAmount() || operationLoading()">
              Retirer
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .wallet-search { margin-bottom: 2rem; background: #fff; padding: 1.5rem; border-radius: 6px; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    .search-bar { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .search-bar input { flex: 1; padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; font-size: 1rem; }
    .search-bar button { padding: 0.5rem 1rem; background: #1a237e; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    .search-bar button:disabled { opacity: 0.5; cursor: not-allowed; }
    .state-msg { padding: 1rem; text-align: center; color: #666; }
    .state-msg--error { color: #c62828; font-weight: bold; }
    .wallet-details { border-top: 1px solid #eee; padding-top: 1rem; margin-bottom: 1rem; }
    .wallet-details h3 { margin-top: 0; color: #1a237e; }
    .wallet-details p { margin: 0.5rem 0; }
    .operations { display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid #eee; padding-top: 1rem; }
    .operation-form { display: flex; gap: 1rem; align-items: center; }
    .operation-form h4 { margin: 0; width: 80px; color: #1a237e; }
    .operation-form input, .operation-form select { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
    .operation-form button { padding: 0.5rem 1rem; background: #43a047; color: #fff; border: none; border-radius: 4px; cursor: pointer; }
    .operation-form button:disabled { opacity: 0.5; cursor: not-allowed; }
    .operation-error { color: #c62828; font-weight: bold; padding: 0.5rem; background: #ffebee; border-radius: 4px; margin: 0; }
  `]
})
export class WalletSearchComponent {
  private walletApi = inject(WalletApiService);

  phoneNumber = signal('');
  wallet = signal<Wallet | null>(null);
  loading = signal(false);
  error = signal(false);

  depositAmount = signal<number | null>(null);
  depositMethod = signal('CREDIT_CARD');
  withdrawAmount = signal<number | null>(null);

  operationLoading = signal(false);
  operationError = signal<string | null>(null);

  onPhoneInput(value: string): void {
    const clean = value.replace(/\D/g, '').substring(0, 9);
    let formatted = '';
    if (clean.length > 0) formatted = clean.substring(0, 2);
    if (clean.length > 2) formatted += ' ' + clean.substring(2, 5);
    if (clean.length > 5) formatted += ' ' + clean.substring(5, 7);
    if (clean.length > 7) formatted += ' ' + clean.substring(7, 9);
    this.phoneNumber.set(formatted);
  }

  search(): void {
    const phone = this.phoneNumber().trim();
    const clean = phone.replace(/\s/g, '');
    if (!clean || clean.length !== 9) return;
    
    this.loading.set(true);
    this.error.set(false);
    this.wallet.set(null);
    this.resetOperations();

    this.walletApi.getByPhone(phone).subscribe({
      next: (data) => {
        this.wallet.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  deposit(): void {
    const w = this.wallet();
    const amount = this.depositAmount();
    const method = this.depositMethod();
    if (!w || !amount || !method) return;

    this.operationLoading.set(true);
    this.operationError.set(null);

    this.walletApi.deposit(w.id, amount, method).subscribe({
      next: (updatedWallet) => {
        this.wallet.set(updatedWallet);
        this.resetOperations();
      },
      error: (err) => {
        this.operationError.set(err.error?.message || 'Erreur lors du dépôt');
        this.operationLoading.set(false);
      }
    });
  }

  withdraw(): void {
    const w = this.wallet();
    const amount = this.withdrawAmount();
    if (!w || !amount) return;

    this.operationLoading.set(true);
    this.operationError.set(null);

    this.walletApi.withdraw(w.phoneNumber, amount).subscribe({
      next: (updatedWallet) => {
        this.wallet.set(updatedWallet);
        this.resetOperations();
      },
      error: (err) => {
        this.operationError.set(err.error?.message || 'Solde insuffisant ou erreur lors du retrait');
        this.operationLoading.set(false);
      }
    });
  }

  private resetOperations(): void {
    this.depositAmount.set(null);
    this.withdrawAmount.set(null);
    this.depositMethod.set('CREDIT_CARD');
    this.operationLoading.set(false);
    this.operationError.set(null);
  }
}

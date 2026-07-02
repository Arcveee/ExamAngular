import { Component, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { Wallet } from '../../../core/models/models';

@Component({
  selector: 'app-wallet-search',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe],
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
        <p class="state-msg state-msg--error">Aucun portefeuille trouvé pour ce numéro</p>
      } @else if (wallet()) {
        <div class="wallet-details">
          <div class="details-header">
            <span class="details-avatar">👤</span>
            <div>
              <p class="details-name">{{ wallet()?.ownerName }}</p>
              <p class="details-phone">{{ wallet()?.phoneNumber }}</p>
            </div>
          </div>
          <div class="details-balance">
            <span class="details-balance__label">Solde actuel</span>
            <span class="details-balance__amount">{{ wallet()?.balance | number:'1.0-0' }} francs</span>
          </div>
        </div>

        @if (successMsg()) {
          <p class="operation-success">✅ {{ successMsg() }}</p>
        }

        <div class="operations">
          @if (operationError()) {
            <p class="operation-error">{{ operationError() }}</p>
          }

          <div class="operation-form">
            <h4>Dépôt</h4>
            <input type="number" [(ngModel)]="depositAmount" placeholder="Montant en francs" min="1" />
            <button (click)="deposit()" [disabled]="!depositAmount() || operationLoading()">
              {{ operationLoading() ? '…' : 'Déposer' }}
            </button>
          </div>

          <div class="operation-form">
            <h4>Retrait</h4>
            <input type="number" [(ngModel)]="withdrawAmount" placeholder="Montant en francs" min="1" />
            <button class="btn-withdraw" (click)="withdraw()" [disabled]="!withdrawAmount() || operationLoading()">
              {{ operationLoading() ? '…' : 'Retirer' }}
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .wallet-search { margin-bottom: 2rem; background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    .search-bar { display: flex; gap: 1rem; margin-bottom: 1rem; }
    .search-bar input { flex: 1; padding: 0.6rem 1rem; border: 1px solid #ccc; border-radius: 6px; font-size: 1rem; }
    .search-bar button { padding: 0.6rem 1.25rem; background: #1a237e; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; }
    .search-bar button:disabled { opacity: 0.5; cursor: not-allowed; }
    .state-msg { padding: 1rem; text-align: center; color: #666; }
    .state-msg--error { color: #c62828; font-weight: bold; }
    .wallet-details { border: 1px solid #e8eaf6; border-radius: 8px; padding: 1rem 1.25rem; margin-bottom: 1rem; background: #f5f7ff; }
    .details-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .details-avatar { font-size: 2rem; background: #e8eaf6; border-radius: 50%; width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; }
    .details-name { font-size: 1.1rem; font-weight: 700; color: #1a237e; margin: 0; }
    .details-phone { color: #666; margin: 0; font-size: 0.9rem; }
    .details-balance { display: flex; justify-content: space-between; align-items: center; background: #1a237e; color: #fff; border-radius: 6px; padding: 0.75rem 1rem; }
    .details-balance__label { font-size: 0.85rem; opacity: 0.85; }
    .details-balance__amount { font-size: 1.2rem; font-weight: 700; }
    .operations { display: flex; flex-direction: column; gap: 1rem; border-top: 1px solid #eee; padding-top: 1rem; }
    .operation-form { display: flex; gap: 1rem; align-items: center; }
    .operation-form h4 { margin: 0; width: 70px; color: #1a237e; font-size: 0.9rem; }
    .operation-form input { flex: 1; padding: 0.5rem 0.75rem; border: 1px solid #ccc; border-radius: 6px; }
    .operation-form button { padding: 0.5rem 1rem; background: #2e7d32; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: 600; min-width: 80px; }
    .operation-form button:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-withdraw { background: #c62828 !important; }
    .operation-error { color: #c62828; font-weight: bold; padding: 0.5rem 1rem; background: #ffebee; border-radius: 6px; margin: 0; }
    .operation-success { color: #2e7d32; font-weight: bold; padding: 0.5rem 1rem; background: #e8f5e9; border-radius: 6px; margin-bottom: 0.75rem; }
  `]
})
export class WalletSearchComponent {
  private walletApi = inject(WalletApiService);

  phoneNumber = signal('');
  wallet = signal<Wallet | null>(null);
  loading = signal(false);
  error = signal(false);

  depositAmount = signal<number | null>(null);
  withdrawAmount = signal<number | null>(null);

  operationLoading = signal(false);
  operationError = signal<string | null>(null);
  successMsg = signal<string | null>(null);

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
    if (!w || !amount) return;

    this.operationLoading.set(true);
    this.operationError.set(null);
    this.successMsg.set(null);

    this.walletApi.deposit(w.id, amount, 'CASH').subscribe({
      next: (updatedWallet) => {
        this.wallet.set(updatedWallet);
        this.successMsg.set(`Dépôt de ${amount.toLocaleString('fr-FR')} francs effectué avec succès !`);
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
    this.successMsg.set(null);

    this.walletApi.withdraw(w.phoneNumber, amount).subscribe({
      next: (updatedWallet) => {
        this.wallet.set(updatedWallet);
        this.successMsg.set(`Retrait de ${amount.toLocaleString('fr-FR')} francs effectué avec succès !`);
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
    this.operationLoading.set(false);
    this.operationError.set(null);
  }
}

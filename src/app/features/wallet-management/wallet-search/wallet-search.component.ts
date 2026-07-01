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
          type="text" 
          [(ngModel)]="phoneNumber" 
          placeholder="Numéro de téléphone"
          (keyup.enter)="search()"
        />
        <button (click)="search()" [disabled]="!phoneNumber()">Rechercher</button>
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
    .wallet-details { border-top: 1px solid #eee; padding-top: 1rem; }
    .wallet-details h3 { margin-top: 0; color: #1a237e; }
    .wallet-details p { margin: 0.5rem 0; }
  `]
})
export class WalletSearchComponent {
  private walletApi = inject(WalletApiService);

  phoneNumber = signal('');
  wallet = signal<Wallet | null>(null);
  loading = signal(false);
  error = signal(false);

  search(): void {
    if (!this.phoneNumber()) return;
    
    this.loading.set(true);
    this.error.set(false);
    this.wallet.set(null);

    this.walletApi.getByPhone(this.phoneNumber()).subscribe({
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
}

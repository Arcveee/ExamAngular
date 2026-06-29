import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WalletStateService } from '../../../core/services/wallet-state.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { Transaction } from '../../../core/models/models';

@Component({
  selector: 'app-history',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  template: `
    <div class="history-page">
      <header class="history-page__header">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Retour
        </button>
        <h1 class="history-page__title">Historique</h1>
        <div class="history-page__balance-pill">
          {{ balance() | number: '1.2-2' }} MAD
        </div>
      </header>

      <div class="filters">
        <div class="filter-group">
          <label>Type</label>
          <select [(ngModel)]="filterType" (ngModelChange)="resetPage()">
            <option value="">Tous</option>
            <option value="DEPOSIT">Dépôt</option>
            <option value="WITHDRAW">Retrait</option>
            <option value="TRANSFER">Transfert</option>
            <option value="PAYMENT">Paiement</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Du</label>
          <input type="date" [(ngModel)]="filterDateStart" (ngModelChange)="resetPage()" />
        </div>
        <div class="filter-group">
          <label>Au</label>
          <input type="date" [(ngModel)]="filterDateEnd" (ngModelChange)="resetPage()" />
        </div>
      </div>

      <div class="table-container">
        @if (loading()) {
          <div class="state-msg">Chargement de l'historique...</div>
        } @else if (error()) {
          <div class="state-msg state-msg--error">Erreur lors du chargement des transactions.</div>
        } @else if (paginatedTransactions().length === 0) {
          <div class="state-msg">Aucune transaction trouvée.</div>
        } @else {
          <table class="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th class="text-right">Montant</th>
                <th class="text-right">Frais</th>
                <th class="text-center">Statut</th>
              </tr>
            </thead>
            <tbody>
              @for (tx of paginatedTransactions(); track tx.id) {
                <tr>
                  <td>{{ tx.date | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ formatType(tx.type) }}</td>
                  <td class="text-right amount-col" [class.amount--positive]="isPositive(tx)" [class.amount--negative]="!isPositive(tx)">
                    {{ isPositive(tx) ? '+' : '-' }}{{ tx.montant | number:'1.2-2' }}
                  </td>
                  <td class="text-right">{{ (tx.frais || 0) | number:'1.2-2' }}</td>
                  <td class="text-center">
                    <span class="status-badge" [class.status--success]="(tx.statut || 'SUCCESS') === 'SUCCESS'">
                      {{ tx.statut || 'SUCCESS' }}
                    </span>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      @if (!loading() && !error() && totalPages() > 1) {
        <div class="pagination">
          <button [disabled]="currentPage() === 0" (click)="prevPage()">Précédent</button>
          <span>Page {{ currentPage() + 1 }} sur {{ totalPages() }}</span>
          <button [disabled]="currentPage() >= totalPages() - 1" (click)="nextPage()">Suivant</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .history-page {
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f1b35 0%, #1a2f55 50%, #0d2137 100%);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .history-page__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .back-btn {
      display: flex;
      align-items: center;
      gap: 0.35rem;
      background: rgba(255,255,255,.08);
      border: 1px solid rgba(255,255,255,.12);
      color: rgba(255,255,255,.75);
      padding: 0.45rem 0.9rem;
      border-radius: 20px;
      font-size: 0.85rem;
      cursor: pointer;
      transition: background .2s, color .2s;
    }

    .back-btn:hover { background: rgba(255,255,255,.14); color: #fff; }
    .history-page__title { color: #fff; font-size: 1.1rem; font-weight: 700; margin: 0; }
    .history-page__balance-pill {
      background: linear-gradient(135deg, #0070f3, #00c9a7);
      color: #fff;
      padding: 0.3rem 0.85rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .filters {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
      background: rgba(255,255,255,.06);
      padding: 1rem;
      border-radius: 12px;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      flex: 1;
      min-width: 120px;
    }

    .filter-group label {
      color: rgba(255,255,255,.6);
      font-size: 0.8rem;
    }

    .filter-group input, .filter-group select {
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.15);
      color: #fff;
      padding: 0.5rem;
      border-radius: 8px;
      font-size: 0.9rem;
      outline: none;
    }
    .filter-group select option { background: #1a2f55; color: #fff; }

    .table-container {
      background: rgba(255,255,255,.06);
      border-radius: 12px;
      overflow-x: auto;
    }

    .state-msg { color: rgba(255,255,255,.6); text-align: center; padding: 2rem; }
    .state-msg--error { color: #f87171; }

    .history-table {
      width: 100%;
      border-collapse: collapse;
      color: #fff;
      font-size: 0.9rem;
    }

    .history-table th, .history-table td {
      padding: 1rem;
      border-bottom: 1px solid rgba(255,255,255,.1);
    }

    .history-table th {
      text-align: left;
      color: rgba(255,255,255,.5);
      font-weight: 500;
      font-size: 0.85rem;
      text-transform: uppercase;
    }

    .text-right { text-align: right !important; }
    .text-center { text-align: center !important; }

    .amount-col { font-weight: 600; }
    .amount--positive { color: #4ade80; }
    .amount--negative { color: #f87171; }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(255,255,255,.1);
    }
    .status--success { background: rgba(74,222,128,.15); color: #4ade80; }

    .pagination {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      color: rgba(255,255,255,.6);
      font-size: 0.9rem;
      margin-top: 1rem;
    }

    .pagination button {
      background: rgba(255,255,255,.1);
      border: none;
      color: #fff;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
    }
    .pagination button:hover:not(:disabled) { background: rgba(255,255,255,.15); }
    .pagination button:disabled { opacity: 0.3; cursor: not-allowed; }
  `]
})
export class HistoryComponent implements OnInit {
  private walletState = inject(WalletStateService);
  private walletApi = inject(WalletApiService);
  private router = inject(Router);

  readonly balance = this.walletState.balance;
  readonly phone = this.walletState.phone;

  transactions = signal<Transaction[]>([]);
  loading = signal(true);
  error = signal(false);

  filterType = signal<string>('');
  filterDateStart = signal<string>('');
  filterDateEnd = signal<string>('');

  pageSize = signal(10);
  currentPage = signal(0);

  readonly filteredTransactions = computed(() => {
    let list = this.transactions();
    const type = this.filterType();
    const start = this.filterDateStart();
    const end = this.filterDateEnd();

    if (type) {
      list = list.filter(tx => tx.type && tx.type.toUpperCase().includes(type));
    }
    if (start) {
      const startDate = new Date(start).getTime();
      list = list.filter(tx => new Date(tx.date).getTime() >= startDate);
    }
    if (end) {
      const endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      list = list.filter(tx => new Date(tx.date).getTime() <= endDate.getTime());
    }

    // Sort by date desc
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  });

  readonly totalPages = computed(() => Math.ceil(this.filteredTransactions().length / this.pageSize()));

  readonly paginatedTransactions = computed(() => {
    const start = this.currentPage() * this.pageSize();
    return this.filteredTransactions().slice(start, start + this.pageSize());
  });

  ngOnInit() {
    this.loadHistory();
  }

  loadHistory() {
    const phone = this.phone();
    if (!phone) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    this.walletApi.getTransactionsByPhone(phone).subscribe({
      next: (data) => {
        this.transactions.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  resetPage() {
    this.currentPage.set(0);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages() - 1) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 0) {
      this.currentPage.update(p => p - 1);
    }
  }

  goBack() {
    this.router.navigate(['/client']);
  }

  formatType(type: string): string {
    if (!type) return 'Inconnu';
    const t = type.toUpperCase();
    if (t.includes('DEPOSIT')) return 'Dépôt';
    if (t.includes('WITHDRAW')) return 'Retrait';
    if (t.includes('TRANSFER')) return 'Transfert';
    if (t.includes('PAYMENT') || t.includes('PAY')) return 'Paiement';
    return type;
  }

  isPositive(tx: Transaction): boolean {
    const t = (tx.type || '').toUpperCase();
    return t.includes('DEPOSIT') || t.includes('RECEIVE') || t.includes('ENTRANT');
  }
}

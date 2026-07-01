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
                    <span class="status-badge" 
                          [class.status-badge--success]="(tx.statut || 'SUCCESS') === 'SUCCESS'"
                          [class.status-badge--pending]="tx.statut === 'PENDING'"
                          [class.status-badge--failed]="tx.statut === 'FAILED'">
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
          <button class="page-btn" [disabled]="currentPage() === 0" (click)="prevPage()">Précédent</button>
          <span class="page-info">Page {{ currentPage() + 1 }} sur {{ totalPages() }}</span>
          <button class="page-btn" [disabled]="currentPage() >= totalPages() - 1" (click)="nextPage()">Suivant</button>
        </div>
      }
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .history-page {
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      background-color: #f9fafb;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      color: #111827;
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
      background: #ffffff;
      border: 1px solid #d1d5db;
      color: #374151;
      padding: 0.45rem 0.9rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .back-btn:hover {
      background: #f3f4f6;
      color: #111827;
    }

    .history-page__title {
      color: #111827;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }

    .history-page__balance-pill {
      background: #eff6ff;
      color: #2563eb;
      padding: 0.3rem 0.85rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .filters-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
    }
    
    .filters-row {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .filter-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
      flex: 1;
      min-width: 140px;
    }

    .filter-group label {
      color: #4b5563;
      font-size: 0.78rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .filter-group input, .filter-group select {
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 0.75rem;
      color: #111827;
      font-size: 0.95rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s;
    }

    .filter-group input:focus, .filter-group select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }

    .table-container {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow-x: auto;
      box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      background: #f9fafb;
      color: #4b5563;
      font-weight: 600;
      font-size: 0.85rem;
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      white-space: nowrap;
    }

    td {
      padding: 1rem;
      border-bottom: 1px solid #e5e7eb;
      font-size: 0.95rem;
      color: #111827;
    }
    
    tr:last-child td {
      border-bottom: none;
    }

    tr:hover td {
      background: #f9fafb;
    }

    .amount--positive { color: #10b981; font-weight: 600; }
    .amount--negative { color: #ef4444; font-weight: 600; }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.6rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .status-badge--success { background: #d1fae5; color: #065f46; }
    .status-badge--pending { background: #fef3c7; color: #92400e; }
    .status-badge--failed { background: #fee2e2; color: #991b1b; }

    .empty-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #6b7280;
      font-size: 0.95rem;
    }
    
    .loading-state {
      text-align: center;
      padding: 3rem 1rem;
      color: #6b7280;
    }

    .pagination {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-top: 0.5rem;
    }

    .page-btn {
      background: #ffffff;
      border: 1px solid #d1d5db;
      color: #374151;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .page-btn:hover:not(:disabled) {
      background: #f3f4f6;
    }

    .page-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .page-info {
      color: #4b5563;
      font-size: 0.9rem;
    }
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
    this.router.navigate(['/dashboard']);
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

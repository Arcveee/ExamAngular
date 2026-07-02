import {
  Component,
  inject,
  OnInit,
  signal,
  computed,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { WalletStateService } from '../../../core/services/wallet-state.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { Transaction } from '../../../core/models/models';

declare const Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DecimalPipe, RouterLink],
  template: `
    <div class="dashboard">
      <header class="dashboard__header">
        <div class="dashboard__greeting">
          <span class="dashboard__icon">👤</span>
          <div>
            <p class="dashboard__label">Espace Client</p>
            <p class="dashboard__phone">{{ phone() }}</p>
          </div>
        </div>
        <div class="dashboard__badge">BadWallet</div>
      </header>

      <section class="balance-card">
        <p class="balance-card__label">Solde disponible</p>
        @if (balanceLoading()) {
          <div class="balance-card__skeleton"></div>
        } @else if (balanceError()) {
          <p class="balance-card__error">Impossible de charger le solde</p>
        } @else {
          <p class="balance-card__amount">
            {{ balance() | number: '1.0-0' }}
            <span class="balance-card__devise">francs</span>
          </p>
        }
        <div class="balance-card__meta">
          <span class="balance-card__dot balance-card__dot--green"></span>
          Compte actif
        </div>
      </section>

      <section class="quick-actions">
        <a routerLink="/transfer" class="quick-action-btn">
          <div class="quick-action-btn__icon">↗</div>
          <span>Transfert</span>
        </a>
        <a routerLink="/bills/current" class="quick-action-btn">
          <div class="quick-action-btn__icon">📄</div>
          <span>Factures</span>
        </a>
        <a routerLink="/transactions" class="quick-action-btn">
          <div class="quick-action-btn__icon">🕒</div>
          <span>Historique</span>
        </a>
      </section>

      <section class="stats-row">
        <div class="stat-card stat-card--income">
          <p class="stat-card__label">Revenus du mois</p>
          <p class="stat-card__value">+{{ totalRevenues() | number: '1.0-0' }} francs</p>
        </div>
        <div class="stat-card stat-card--expense">
          <p class="stat-card__label">Dépenses du mois</p>
          <p class="stat-card__value">-{{ totalExpenses() | number: '1.0-0' }} francs</p>
        </div>
      </section>

      <section class="chart-section">
        <h2 class="chart-section__title">Répartition du mois</h2>
        @if (txLoading()) {
          <div class="chart-section__placeholder">Chargement du graphique…</div>
        } @else if (txError()) {
          <div class="chart-section__placeholder chart-section__placeholder--error">
            Données indisponibles
          </div>
        } @else if (noTx()) {
          <div class="chart-section__placeholder">Aucune transaction ce mois-ci</div>
        } @else {
          <div class="chart-section__wrap">
            <canvas #chartCanvas width="260" height="260"></canvas>
            <div class="chart-section__legend">
              <div class="legend-item">
                <span class="legend-dot legend-dot--income"></span>
                <span>Revenus</span>
                <strong>{{ totalRevenues() | number: '1.0-0' }} francs</strong>
              </div>
              <div class="legend-item">
                <span class="legend-dot legend-dot--expense"></span>
                <span>Dépenses</span>
                <strong>{{ totalExpenses() | number: '1.0-0' }} francs</strong>
              </div>
            </div>
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .dashboard {
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      background-color: #f9fafb;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      color: #111827;
    }

    .dashboard__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dashboard__greeting {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .dashboard__icon {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #4b5563;
    }

    .dashboard__label {
      color: #6b7280;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0;
    }

    .dashboard__phone {
      font-size: 1rem;
      font-weight: 700;
      margin: 0;
    }

    .dashboard__badge {
      background: rgba(37,99,235,0.1);
      color: #2563eb;
      padding: 0.4rem 0.8rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .balance-card {
      background: #2563eb;
      border-radius: 16px;
      padding: 2rem 1.75rem;
      box-shadow: 0 10px 15px -3px rgba(37,99,235,0.3);
      position: relative;
      overflow: hidden;
      color: #ffffff;
    }

    .balance-card::after {
      content: '';
      position: absolute;
      bottom: -30px;
      left: -20px;
      width: 120px;
      height: 120px;
      background: rgba(255,255,255,0.1);
      border-radius: 50%;
    }

    .balance-card__label {
      font-size: 0.9rem;
      font-weight: 500;
      opacity: 0.9;
      margin: 0 0 0.5rem;
    }

    .balance-card__amount {
      font-size: 2.5rem;
      font-weight: 700;
      margin: 0 0 1rem;
      letter-spacing: -0.02em;
    }

    .balance-card__devise {
      font-size: 1.2rem;
      font-weight: 400;
      margin-left: 0.25rem;
      opacity: 0.9;
    }

    .balance-card__meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,0.9);
      font-size: 0.8rem;
    }

    .balance-card__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .balance-card__dot--green { background: #4ade80; }

    .quick-actions {
      display: flex;
      gap: 1rem;
    }

    .quick-action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem 0.5rem;
      color: #374151;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.2s;
      flex: 1;
      box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
    }

    .quick-action-btn:hover {
      border-color: #d1d5db;
      transform: translateY(-2px);
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }

    .quick-action-btn__icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #eff6ff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #2563eb;
    }

    .stats-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .stat-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem;
      box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
    }

    .stat-card__label {
      color: #6b7280;
      font-size: 0.8rem;
      font-weight: 500;
      margin: 0 0 0.5rem;
    }

    .stat-card__value {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
    }
    
    .stat-card--income .stat-card__value { color: #10b981; }
    .stat-card--expense .stat-card__value { color: #ef4444; }

    .chart-section {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 1.5rem;
      box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
    }

    .chart-section__title {
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0 0 1.5rem;
      color: #111827;
    }

    .chart-section__wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
    }

    .chart-section__placeholder {
      text-align: center;
      padding: 2rem;
      color: #6b7280;
      background: #f3f4f6;
      border-radius: 12px;
      font-size: 0.9rem;
    }

    .chart-section__placeholder--error {
      color: #ef4444;
      background: #fef2f2;
    }

    .chart-section__legend {
      display: flex;
      justify-content: center;
      gap: 1.5rem;
      width: 100%;
    }

    .legend-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      font-size: 0.8rem;
      color: #4b5563;
      gap: 0.2rem;
    }

    .legend-item strong {
      color: #111827;
      font-size: 0.95rem;
    }

    .legend-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-bottom: 0.2rem;
    }

    .legend-dot--income { background: #10b981; }
    .legend-dot--expense { background: #ef4444; }
  `],
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  private walletState = inject(WalletStateService);
  private walletApi = inject(WalletApiService);

  readonly balance = this.walletState.balance;
  readonly phone = this.walletState.phone;

  balanceLoading = signal(true);
  balanceError = signal(false);
  devise = signal('MAD');

  txLoading = signal(true);
  txError = signal(false);

  private revenues = signal(0);
  private expenses = signal(0);

  readonly totalRevenues = computed(() => this.revenues());
  readonly totalExpenses = computed(() => this.expenses());
  readonly noTx = computed(() => this.revenues() === 0 && this.expenses() === 0);

  private chartInstance: any = null;
  private chartReady = false;
  private dataReady = false;

  ngOnInit(): void {
    const phone = this.phone();
    if (phone) {
      this.loadBalance(phone);
      this.loadTransactions(phone);
    } else {
      this.balanceLoading.set(false);
      this.balanceError.set(true);
      this.txLoading.set(false);
      this.txError.set(true);
    }
    this.injectChartJs();
  }

  ngAfterViewInit(): void {
    this.chartReady = true;
    if (this.dataReady && !this.noTx()) {
      this.renderChart();
    }
  }

  ngOnDestroy(): void {
    if (this.chartInstance) {
      this.chartInstance.destroy();
    }
  }

  private loadBalance(phone: string): void {
    this.walletApi.getBalance(phone).subscribe({
      next: wallet => {
        this.walletState.setBalance(wallet.balance);
        this.walletState.setWalletId(wallet.id);
        this.walletState.setWalletCode(wallet.code);
        this.devise.set(wallet.devise);
        this.balanceLoading.set(false);
      },
      error: () => {
        this.balanceLoading.set(false);
        this.balanceError.set(true);
      },
    });
  }

  private loadTransactions(phone: string): void {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    this.walletApi.getTransactionsByPhone(phone).subscribe({
      next: (transactions: Transaction[]) => {
        const monthly = transactions.filter(tx => {
          const d = new Date(tx.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        const incomeTypes = ['DEPOT', 'DEPOT_CARTE', 'VIREMENT_ENTRANT', 'CREDIT', 'RECEIVE'];
        let rev = 0;
        let exp = 0;

        monthly.forEach(tx => {
          const typeUpper = tx.type?.toUpperCase() ?? '';
          if (incomeTypes.some(t => typeUpper.includes(t))) {
            rev += tx.montant;
          } else {
            exp += tx.montant;
          }
        });

        this.revenues.set(rev);
        this.expenses.set(exp);
        this.txLoading.set(false);
        this.dataReady = true;

        if (this.chartReady && (rev > 0 || exp > 0)) {
          setTimeout(() => this.renderChart(), 0);
        }
      },
      error: () => {
        this.txLoading.set(false);
        this.txError.set(true);
      },
    });
  }

  private injectChartJs(): void {
    if ((window as any)['Chart']) return;
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    script.onload = () => {
      if (this.chartReady && this.dataReady && !this.noTx()) {
        this.renderChart();
      }
    };
    document.head.appendChild(script);
  }

  private renderChart(): void {
    if (!this.chartCanvas?.nativeElement) return;
    if (!(window as any)['Chart']) return;

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const ctx = this.chartCanvas.nativeElement.getContext('2d');
    this.chartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Revenus', 'Dépenses'],
        datasets: [
          {
            data: [this.revenues(), this.expenses()],
            backgroundColor: ['rgba(74, 222, 128, 0.85)', 'rgba(248, 113, 113, 0.85)'],
            borderColor: ['#4ade80', '#f87171'],
            borderWidth: 2,
            hoverOffset: 8,
          },
        ],
      },
      options: {
        cutout: '70%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => ` ${ctx.label}: ${ctx.parsed.toFixed(2)}`,
            },
          },
        },
        animation: { animateRotate: true, duration: 800 },
      },
    });
  }
}

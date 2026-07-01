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
            {{ balance() | number: '1.2-2' }}
            <span class="balance-card__devise">{{ devise() }}</span>
          </p>
        }
        <div class="balance-card__meta">
          <span class="balance-card__dot balance-card__dot--green"></span>
          Compte actif
        </div>
      </section>

      <section class="quick-actions">
        <a class="quick-action-btn" routerLink="/client/transfer">
          <div class="quick-action-btn__icon">↗</div>
          <span>Virement</span>
        </a>
      </section>

      <section class="stats-row">
        <div class="stat-card stat-card--income">
          <p class="stat-card__label">Revenus du mois</p>
          <p class="stat-card__value">+{{ totalRevenues() | number: '1.2-2' }}</p>
        </div>
        <div class="stat-card stat-card--expense">
          <p class="stat-card__label">Dépenses du mois</p>
          <p class="stat-card__value">-{{ totalExpenses() | number: '1.2-2' }}</p>
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
                <strong>{{ totalRevenues() | number: '1.2-2' }}</strong>
              </div>
              <div class="legend-item">
                <span class="legend-dot legend-dot--expense"></span>
                <span>Dépenses</span>
                <strong>{{ totalExpenses() | number: '1.2-2' }}</strong>
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
      background: linear-gradient(135deg, #0f1b35 0%, #1a2f55 50%, #0d2137 100%);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
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
      font-size: 2rem;
      background: rgba(255,255,255,.08);
      border-radius: 50%;
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .dashboard__label {
      color: rgba(255,255,255,.5);
      font-size: 0.75rem;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .dashboard__phone {
      color: #fff;
      font-size: 0.95rem;
      font-weight: 600;
      margin: 0.15rem 0 0;
    }

    .dashboard__badge {
      background: linear-gradient(135deg, #00c9a7, #0070f3);
      color: #fff;
      padding: 0.3rem 0.9rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.04em;
    }

    .balance-card {
      background: linear-gradient(135deg, #0070f3 0%, #00c9a7 100%);
      border-radius: 20px;
      padding: 2rem 1.75rem;
      box-shadow: 0 8px 32px rgba(0,112,243,.35);
      position: relative;
      overflow: hidden;
    }

    .balance-card::before {
      content: '';
      position: absolute;
      top: -40px;
      right: -40px;
      width: 160px;
      height: 160px;
      background: rgba(255,255,255,.08);
      border-radius: 50%;
    }

    .balance-card::after {
      content: '';
      position: absolute;
      bottom: -60px;
      right: 20px;
      width: 200px;
      height: 200px;
      background: rgba(255,255,255,.05);
      border-radius: 50%;
    }

    .balance-card__label {
      color: rgba(255,255,255,.75);
      font-size: 0.85rem;
      margin: 0 0 0.5rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .balance-card__skeleton {
      height: 3rem;
      width: 200px;
      background: rgba(255,255,255,.2);
      border-radius: 8px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: .4; }
    }

    .balance-card__error {
      color: rgba(255,255,255,.8);
      font-size: 1rem;
      margin: 0;
    }

    .balance-card__amount {
      font-size: 3rem;
      font-weight: 700;
      color: #fff;
      margin: 0 0 1rem;
      line-height: 1;
      letter-spacing: -0.02em;
    }

    .balance-card__devise {
      font-size: 1.2rem;
      font-weight: 400;
      margin-left: 0.25rem;
      opacity: .8;
    }

    .balance-card__meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: rgba(255,255,255,.75);
      font-size: 0.8rem;
    }

    .balance-card__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      display: inline-block;
    }

    .balance-card__dot--green { background: #4ade80; box-shadow: 0 0 6px #4ade80; }

    .quick-actions {
      display: flex;
      gap: 1rem;
    }

    .quick-action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.4rem;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 16px;
      padding: 1rem 1.5rem;
      color: rgba(255,255,255,.85);
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 500;
      transition: background .2s, transform .15s;
      flex: 1;
    }

    .quick-action-btn:hover {
      background: rgba(255,255,255,.12);
      transform: translateY(-2px);
    }

    .quick-action-btn__icon {
      width: 40px;
      height: 40px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0070f3, #00c9a7);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      color: #fff;
      box-shadow: 0 4px 14px rgba(0,112,243,.3);
    }

    .stats-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .stat-card {
      border-radius: 16px;
      padding: 1.25rem;
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.1);
      backdrop-filter: blur(10px);
    }

    .stat-card__label {
      color: rgba(255,255,255,.55);
      font-size: 0.75rem;
      margin: 0 0 0.4rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-card--income .stat-card__value { color: #4ade80; }
    .stat-card--expense .stat-card__value { color: #f87171; }

    .stat-card__value {
      font-size: 1.2rem;
      font-weight: 700;
      margin: 0;
    }

    .chart-section {
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.1);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 1.5rem;
    }

    .chart-section__title {
      color: #fff;
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 1.25rem;
    }

    .chart-section__placeholder {
      color: rgba(255,255,255,.4);
      text-align: center;
      padding: 3rem 0;
      font-size: 0.9rem;
    }

    .chart-section__placeholder--error { color: #f87171; }

    .chart-section__wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 2rem;
      flex-wrap: wrap;
    }

    canvas { max-width: 220px; max-height: 220px; }

    .chart-section__legend {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      color: rgba(255,255,255,.85);
      font-size: 0.9rem;
    }

    .legend-item strong {
      margin-left: auto;
      color: #fff;
      font-size: 1rem;
      min-width: 80px;
      text-align: right;
    }

    .legend-dot {
      width: 12px;
      height: 12px;
      border-radius: 3px;
      flex-shrink: 0;
    }

    .legend-dot--income { background: #4ade80; }
    .legend-dot--expense { background: #f87171; }
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

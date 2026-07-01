import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { WalletStateService } from '../../../core/services/wallet-state.service';
import { BillingApiService } from '../../../core/services/billing-api.service';
import { Facture } from '../../../core/models/models';

@Component({
  selector: 'app-billing',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  template: `
    <div class="billing-page">
      <header class="billing-page__header">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Retour
        </button>
        <h1 class="billing-page__title">Factures Impayées</h1>
        <div class="billing-page__balance-pill">
          {{ balance() | number: '1.2-2' }} MAD
        </div>
      </header>

      <div class="filter-section">
        <label class="filter-label" for="provider-select">Filtrer par fournisseur</label>
        <select
          id="provider-select"
          class="filter-select"
          [(ngModel)]="selectedProvider"
          (ngModelChange)="loadFactures()"
        >
          <option value="">Tous les fournisseurs</option>
          <option value="WOYAFAL">WOYAFAL</option>
          <option value="SENELEC">SENELEC</option>
          <option value="SONATEL">SONATEL</option>
          <option value="ISM">ISM</option>
        </select>
      </div>

      <div class="factures-list">
        @if (loading()) {
          <div class="loading-state">Chargement des factures...</div>
        } @else if (error()) {
          <div class="error-state">Erreur lors du chargement des factures.</div>
        } @else if (factures().length === 0) {
          <div class="empty-state">Aucune facture impayée trouvée.</div>
        } @else {
          @for (facture of factures(); track facture.id) {
            <div class="facture-card" [class.facture-card--selected]="isSelected(facture.id)">
              <div class="facture-card__checkbox">
                <input
                  type="checkbox"
                  [id]="'check-' + facture.id"
                  [checked]="isSelected(facture.id)"
                  (change)="toggleSelection(facture.id)"
                />
              </div>
              <label class="facture-card__content" [for]="'check-' + facture.id">
                <div class="facture-card__header">
                  <span class="facture-card__provider">{{ facture.emetteur }}</span>
                  <span class="facture-card__ref">Réf: {{ facture.reference }}</span>
                </div>
                <div class="facture-card__details">
                  <div class="facture-card__amount">{{ facture.montant | number: '1.2-2' }} MAD</div>
                  <div class="facture-card__date">
                    Échéance: {{ facture.echeance ? (facture.echeance | date: 'dd/MM/yyyy') : 'N/A' }}
                  </div>
                </div>
              </label>
            </div>
          }
        }
      </div>

      @if (selectedFactures().length > 0) {
        <div class="summary-section">
          <div class="summary-info">
            <span class="summary-count">{{ selectedFactures().length }} sélectionnée(s)</span>
            <span class="summary-total">Total: {{ totalSelectedAmount() | number: '1.2-2' }} MAD</span>
          </div>
          <button class="pay-btn" (click)="proceedToPayment()" [disabled]="totalSelectedAmount() > balance()">
            Préparer le paiement
          </button>
          @if (totalSelectedAmount() > balance()) {
            <p class="summary-error">Solde insuffisant pour payer ces factures.</p>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .billing-page {
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f1b35 0%, #1a2f55 50%, #0d2137 100%);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-bottom: 6rem; /* Space for summary footer */
    }

    .billing-page__header {
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

    .back-btn:hover {
      background: rgba(255,255,255,.14);
      color: #fff;
    }

    .billing-page__title {
      color: #fff;
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
    }

    .billing-page__balance-pill {
      background: linear-gradient(135deg, #0070f3, #00c9a7);
      color: #fff;
      padding: 0.3rem 0.85rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }

    .filter-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-label {
      color: rgba(255,255,255,.6);
      font-size: 0.85rem;
    }

    .filter-select {
      background: rgba(255,255,255,.07);
      border: 1px solid rgba(255,255,255,.15);
      color: #fff;
      padding: 0.75rem 1rem;
      border-radius: 12px;
      font-size: 1rem;
      outline: none;
    }

    .filter-select option {
      background: #1a2f55;
      color: #fff;
    }

    .factures-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .loading-state, .error-state, .empty-state {
      color: rgba(255,255,255,.6);
      text-align: center;
      padding: 2rem;
      background: rgba(255,255,255,.05);
      border-radius: 12px;
    }

    .error-state { color: #f87171; }

    .facture-card {
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.1);
      border-radius: 16px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: background 0.2s, border-color 0.2s;
      cursor: pointer;
    }

    .facture-card--selected {
      background: rgba(0,201,167,.1);
      border-color: rgba(0,201,167,.4);
    }

    .facture-card__checkbox input {
      width: 20px;
      height: 20px;
      accent-color: #00c9a7;
    }

    .facture-card__content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      cursor: pointer;
    }

    .facture-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .facture-card__provider {
      color: #fff;
      font-weight: 600;
      font-size: 1rem;
    }

    .facture-card__ref {
      color: rgba(255,255,255,.5);
      font-size: 0.8rem;
    }

    .facture-card__details {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .facture-card__amount {
      color: #00c9a7;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .facture-card__date {
      color: rgba(255,255,255,.6);
      font-size: 0.85rem;
    }

    .summary-section {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(15,27,53,.95);
      backdrop-filter: blur(10px);
      border-top: 1px solid rgba(255,255,255,.1);
      padding: 1rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 10;
    }

    .summary-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #fff;
    }

    .summary-count {
      font-size: 0.9rem;
      color: rgba(255,255,255,.7);
    }

    .summary-total {
      font-weight: 700;
      font-size: 1.1rem;
    }

    .pay-btn {
      background: linear-gradient(135deg, #0070f3, #00c9a7);
      color: #fff;
      border: none;
      padding: 1rem;
      border-radius: 12px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
    }

    .pay-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .summary-error {
      color: #f87171;
      font-size: 0.8rem;
      margin: 0;
      text-align: center;
    }
  `]
})
export class BillingComponent implements OnInit {
  private walletState = inject(WalletStateService);
  private billingApi = inject(BillingApiService);
  private router = inject(Router);

  readonly balance = this.walletState.balance;
  readonly walletCode = this.walletState.walletCode;

  selectedProvider = signal('');
  factures = signal<Facture[]>([]);
  loading = signal(false);
  error = signal(false);

  selectedFactures = signal<string[]>([]);

  readonly totalSelectedAmount = computed(() => {
    return this.factures()
      .filter(f => this.selectedFactures().includes(f.id))
      .reduce((sum, f) => sum + f.montant, 0);
  });

  ngOnInit() {
    this.loadFactures();
  }

  loadFactures() {
    const code = this.walletCode();
    if (!code) {
      this.error.set(true);
      return;
    }

    this.loading.set(true);
    this.error.set(false);
    this.selectedFactures.set([]); // Reset selection on filter change

    const unite = this.selectedProvider() || undefined;

    this.billingApi.getCurrentFactures(code, unite).subscribe({
      next: (data) => {
        // Filter out already paid factures just in case the API doesn't do it
        this.factures.set(data.filter(f => f.statut !== 'PAYEE'));
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  toggleSelection(id: string) {
    this.selectedFactures.update(selected => {
      if (selected.includes(id)) {
        return selected.filter(sId => sId !== id);
      } else {
        return [...selected, id];
      }
    });
  }

  isSelected(id: string): boolean {
    return this.selectedFactures().includes(id);
  }

  goBack() {
    this.router.navigate(['/client']);
  }

  proceedToPayment() {
    // Feature suivante : aller vers la page de paiement avec les factures sélectionnées
    console.log('Proceeding to payment for:', this.selectedFactures());
  }
}

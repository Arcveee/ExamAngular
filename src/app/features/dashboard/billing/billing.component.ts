import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { WalletStateService } from '../../../core/services/wallet-state.service';
import { BillingApiService } from '../../../core/services/billing-api.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';
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

      @if (successMessage()) {
        <div class="success-banner">
          <div class="success-banner__icon">✓</div>
          <div>
            <p class="success-banner__title">Paiement effectué</p>
            <p class="success-banner__sub">{{ successMessage() }}</p>
          </div>
        </div>
      }

      <div class="filter-section">
        <label class="filter-label" for="provider-select">Sélectionner un fournisseur</label>
        <select
          id="provider-select"
          class="filter-select"
          [(ngModel)]="selectedProvider"
          (ngModelChange)="onProviderChange()"
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

      <div class="summary-section">
        @if (paymentError()) {
          <div class="api-error">{{ paymentError() }}</div>
        }

        @if (selectedFactures().length > 0) {
          <div class="summary-info">
            <span class="summary-count">{{ selectedFactures().length }} sélectionnée(s)</span>
            <span class="summary-total">Total: {{ totalSelectedAmount() | number: '1.2-2' }} MAD</span>
          </div>
          <button 
            class="pay-btn" 
            [class.pay-btn--loading]="paymentLoading()"
            (click)="paySelectedFactures()" 
            [disabled]="totalSelectedAmount() > balance() || paymentLoading()"
          >
            @if (paymentLoading()) {
              <span class="pay-btn__spinner"></span> Paiement en cours...
            } @else {
              Payer la sélection
            }
          </button>
          @if (totalSelectedAmount() > balance()) {
            <p class="summary-error">Solde insuffisant pour payer ces factures.</p>
          }
        } @else {
          <div class="service-pay">
            <p class="service-pay__title">Paiement libre de service</p>
            <div class="service-pay__inputs">
              <input 
                type="number" 
                class="service-pay__input" 
                [(ngModel)]="serviceAmount" 
                placeholder="Montant (MAD)"
                min="0.01"
              />
              <button 
                class="pay-btn service-pay__btn" 
                [class.pay-btn--loading]="paymentLoading()"
                (click)="payService()" 
                [disabled]="!canPayService() || paymentLoading()"
              >
                @if (paymentLoading()) {
                  <span class="pay-btn__spinner"></span>
                } @else {
                  Payer le service
                }
              </button>
            </div>
            @if (!selectedProvider()) {
              <p class="summary-error">Sélectionnez d'abord un fournisseur ci-dessus.</p>
            } @else if (serviceAmount() && serviceAmount()! > balance()) {
              <p class="summary-error">Solde insuffisant.</p>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .billing-page {
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      background-color: #f9fafb;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding-bottom: 9rem;
      color: #111827;
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

    .billing-page__title {
      color: #111827;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }

    .billing-page__balance-pill {
      background: #eff6ff;
      color: #2563eb;
      padding: 0.3rem 0.85rem;
      border-radius: 20px;
      font-size: 0.8rem;
      font-weight: 600;
      white-space: nowrap;
    }
    
    .success-banner {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 12px;
      padding: 1rem 1.25rem;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .success-banner__icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #10b981;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .success-banner__title {
      color: #065f46;
      font-weight: 700;
      margin: 0 0 0.15rem;
      font-size: 0.95rem;
    }

    .success-banner__sub {
      color: #047857;
      font-size: 0.82rem;
      margin: 0;
    }

    .filter-section {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .filter-label {
      color: #4b5563;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .filter-select {
      background: #ffffff;
      border: 1px solid #d1d5db;
      color: #111827;
      padding: 0.75rem 1rem;
      border-radius: 8px;
      font-size: 1rem;
      outline: none;
      transition: all 0.2s;
    }

    .filter-select:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }

    .factures-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .loading-state, .error-state, .empty-state {
      color: #6b7280;
      text-align: center;
      padding: 2rem;
      background: #f3f4f6;
      border-radius: 12px;
      font-size: 0.95rem;
    }

    .error-state {
      color: #ef4444;
      background: #fef2f2;
    }

    .facture-card {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      transition: all 0.2s;
      cursor: pointer;
      box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
    }
    
    .facture-card:hover {
      border-color: #d1d5db;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
    }

    .facture-card--selected {
      background: #eff6ff;
      border-color: #93c5fd;
    }

    .facture-card__checkbox input {
      width: 20px;
      height: 20px;
      accent-color: #2563eb;
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
      color: #111827;
      font-weight: 600;
      font-size: 1rem;
    }

    .facture-card__ref {
      color: #6b7280;
      font-size: 0.8rem;
    }

    .facture-card__details {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .facture-card__amount {
      color: #2563eb;
      font-weight: 700;
      font-size: 1.1rem;
    }

    .facture-card__date {
      color: #6b7280;
      font-size: 0.85rem;
    }

    .summary-section {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(10px);
      border-top: 1px solid #e5e7eb;
      padding: 1rem 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      z-index: 10;
      box-shadow: 0 -4px 6px -1px rgba(0,0,0,0.05);
    }
    
    .api-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 0.5rem;
      color: #ef4444;
      font-size: 0.85rem;
      text-align: center;
    }

    .summary-info {
      display: flex;
      justify-content: space-between;
      align-items: center;
      color: #111827;
    }

    .summary-count {
      font-size: 0.9rem;
      color: #6b7280;
    }

    .summary-total {
      font-weight: 700;
      font-size: 1.1rem;
    }

    .pay-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 1rem;
      border-radius: 8px;
      font-weight: 600;
      font-size: 1rem;
      cursor: pointer;
      transition: all 0.2s;
    }

    .pay-btn:hover:not(:disabled) {
      background: #1d4ed8;
    }

    .pay-btn:disabled {
      background: #93c5fd;
      cursor: not-allowed;
    }
    
    .pay-btn__spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #ffffff;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }
    
    @keyframes spin { to { transform: rotate(360deg); } }

    .summary-error {
      color: #ef4444;
      font-size: 0.8rem;
      margin: 0;
      text-align: center;
    }
    
    .service-pay {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .service-pay__title {
      color: #111827;
      font-weight: 600;
      font-size: 0.9rem;
      margin: 0;
    }
    
    .service-pay__inputs {
      display: flex;
      gap: 0.5rem;
    }
    
    .service-pay__input {
      flex: 1;
      background: #ffffff;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      padding: 0.75rem;
      color: #111827;
      font-size: 1rem;
      outline: none;
      transition: all 0.2s;
    }

    .service-pay__input:focus {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.1);
    }
    
    .service-pay__btn {
      padding: 0.75rem 1.5rem;
    }
  `]
})
export class BillingComponent implements OnInit {
  private walletState = inject(WalletStateService);
  private billingApi = inject(BillingApiService);
  private walletApi = inject(WalletApiService);
  private router = inject(Router);

  readonly balance = this.walletState.balance;
  readonly walletCode = this.walletState.walletCode;
  readonly phone = this.walletState.phone;

  selectedProvider = signal('');
  factures = signal<Facture[]>([]);
  loading = signal(false);
  error = signal(false);

  selectedFactures = signal<string[]>([]);
  serviceAmount = signal<number | null>(null);
  
  paymentLoading = signal(false);
  paymentError = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  readonly totalSelectedAmount = computed(() => {
    return this.factures()
      .filter(f => this.selectedFactures().includes(f.id))
      .reduce((sum, f) => sum + f.montant, 0);
  });
  
  readonly canPayService = computed(() => {
    const amt = this.serviceAmount();
    return !!this.selectedProvider() && amt !== null && amt > 0 && amt <= this.balance();
  });

  ngOnInit() {
    this.loadFactures();
  }

  onProviderChange() {
    this.successMessage.set(null);
    this.paymentError.set(null);
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
    this.selectedFactures.set([]); 

    const unite = this.selectedProvider() || undefined;

    this.billingApi.getCurrentFactures(code, unite).subscribe({
      next: (data) => {
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
    this.successMessage.set(null);
    this.paymentError.set(null);
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

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  payService() {
    if (!this.canPayService()) return;
    
    this.paymentLoading.set(true);
    this.paymentError.set(null);
    this.successMessage.set(null);
    
    const amount = this.serviceAmount()!;
    const service = this.selectedProvider();
    
    this.walletApi.payService(this.phone(), service, amount)
      .pipe(switchMap(() => this.walletApi.getBalance(this.phone())))
      .subscribe({
        next: (wallet) => {
          this.walletState.setBalance(wallet.balance);
          this.successMessage.set(`Paiement de ${amount} MAD vers ${service} réussi.`);
          this.serviceAmount.set(null);
          this.paymentLoading.set(false);
          this.loadFactures();
        },
        error: (err) => {
          this.paymentError.set(err.error?.message || 'Erreur lors du paiement du service.');
          this.paymentLoading.set(false);
        }
      });
  }
  
  paySelectedFactures() {
    if (this.selectedFactures().length === 0 || this.totalSelectedAmount() > this.balance()) return;
    
    this.paymentLoading.set(true);
    this.paymentError.set(null);
    this.successMessage.set(null);
    
    const references = this.factures()
      .filter(f => this.selectedFactures().includes(f.id))
      .map(f => f.reference);
      
    const total = this.totalSelectedAmount();
    
    this.walletApi.payFactures(this.phone(), references)
      .pipe(switchMap(() => this.walletApi.getBalance(this.phone())))
      .subscribe({
        next: (wallet) => {
          this.walletState.setBalance(wallet.balance);
          this.successMessage.set(`Paiement de ${references.length} facture(s) d'un total de ${total} MAD réussi.`);
          this.paymentLoading.set(false);
          this.loadFactures();
        },
        error: (err) => {
          this.paymentError.set(err.error?.message || 'Erreur lors du paiement des factures.');
          this.paymentLoading.set(false);
        }
      });
  }
}

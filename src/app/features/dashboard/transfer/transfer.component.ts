import { Component, inject, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { WalletStateService } from '../../../core/services/wallet-state.service';
import { WalletApiService } from '../../../core/services/wallet-api.service';

@Component({
  selector: 'app-transfer',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  template: `
    <div class="transfer-page">
      <header class="transfer-page__header">
        <button class="back-btn" (click)="goBack()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Retour
        </button>
        <h1 class="transfer-page__title">Virement</h1>
        <div class="transfer-page__balance-pill">
          {{ balance() | number: '1.2-2' }} {{ devise() }}
        </div>
      </header>

      @if (success()) {
        <div class="success-banner">
          <div class="success-banner__icon">✓</div>
          <div>
            <p class="success-banner__title">Virement effectué</p>
            <p class="success-banner__sub">{{ lastMontant() | number:'1.2-2' }} {{ devise() }} envoyé à {{ lastRecipient() }}</p>
          </div>
        </div>
      }

      <div class="transfer-card">
        <div class="transfer-card__icon-wrap">
          <div class="transfer-card__icon">↗</div>
        </div>
        <p class="transfer-card__lead">Envoyer de l'argent</p>

        <div class="field" [class.field--error]="recipientTouched() && recipientError()">
          <label class="field__label" for="recipient">Numéro destinataire</label>
          <input
            id="recipient"
            type="tel"
            class="field__input"
            [(ngModel)]="recipient"
            placeholder="Ex: 0612345678"
            (blur)="recipientTouched.set(true)"
            (ngModelChange)="clearSuccess()"
            autocomplete="off"
          />
          @if (recipientTouched() && recipientError()) {
            <p class="field__error">{{ recipientError() }}</p>
          }
        </div>

        <div class="field" [class.field--error]="amountTouched() && amountError()">
          <label class="field__label" for="amount">Montant</label>
          <div class="field__amount-wrap">
            <input
              id="amount"
              type="number"
              class="field__input field__input--amount"
              [(ngModel)]="amount"
              placeholder="0.00"
              min="0.01"
              (blur)="amountTouched.set(true)"
              (ngModelChange)="clearSuccess()"
            />
            <span class="field__devise">{{ devise() }}</span>
          </div>
          @if (amountTouched() && amountError()) {
            <p class="field__error">{{ amountError() }}</p>
          }
        </div>

        @if (apiError()) {
          <div class="api-error">{{ apiError() }}</div>
        }

        <button
          class="submit-btn"
          [class.submit-btn--loading]="loading()"
          [disabled]="!canSubmit()"
          (click)="submit()"
        >
          @if (loading()) {
            <span class="submit-btn__spinner"></span>
            Envoi en cours…
          } @else {
            Envoyer
          }
        </button>

        <div class="transfer-meta">
          <span class="transfer-meta__from">Depuis : {{ senderPhone() }}</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .transfer-page {
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #0f1b35 0%, #1a2f55 50%, #0d2137 100%);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .transfer-page__header {
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

    .transfer-page__title {
      color: #fff;
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0;
    }

    .transfer-page__balance-pill {
      background: linear-gradient(135deg, #0070f3, #00c9a7);
      color: #fff;
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
      background: rgba(74,222,128,.12);
      border: 1px solid rgba(74,222,128,.35);
      border-radius: 14px;
      padding: 1rem 1.25rem;
      animation: slideDown .3s ease;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .success-banner__icon {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #4ade80;
      color: #0f2810;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
      font-weight: 700;
      flex-shrink: 0;
    }

    .success-banner__title {
      color: #4ade80;
      font-weight: 700;
      margin: 0 0 0.15rem;
      font-size: 0.95rem;
    }

    .success-banner__sub {
      color: rgba(255,255,255,.6);
      font-size: 0.82rem;
      margin: 0;
    }

    .transfer-card {
      background: rgba(255,255,255,.06);
      border: 1px solid rgba(255,255,255,.1);
      backdrop-filter: blur(16px);
      border-radius: 24px;
      padding: 2rem 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .transfer-card__icon-wrap {
      display: flex;
      justify-content: center;
    }

    .transfer-card__icon {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      background: linear-gradient(135deg, #0070f3, #00c9a7);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.8rem;
      font-weight: 700;
      box-shadow: 0 6px 24px rgba(0,112,243,.35);
    }

    .transfer-card__lead {
      text-align: center;
      color: rgba(255,255,255,.6);
      font-size: 0.9rem;
      margin: 0;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .field__label {
      color: rgba(255,255,255,.55);
      font-size: 0.78rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .field__input {
      background: rgba(255,255,255,.07);
      border: 1.5px solid rgba(255,255,255,.14);
      border-radius: 12px;
      padding: 0.85rem 1rem;
      color: #fff;
      font-size: 1rem;
      font-family: inherit;
      outline: none;
      transition: border-color .2s, box-shadow .2s;
      width: 100%;
      box-sizing: border-box;
    }

    .field__input::placeholder { color: rgba(255,255,255,.25); }

    .field__input:focus {
      border-color: #0070f3;
      box-shadow: 0 0 0 3px rgba(0,112,243,.2);
    }

    .field--error .field__input {
      border-color: #f87171;
      box-shadow: 0 0 0 3px rgba(248,113,113,.15);
    }

    .field__error {
      color: #f87171;
      font-size: 0.78rem;
      margin: 0;
    }

    .field__amount-wrap {
      position: relative;
    }

    .field__input--amount {
      padding-right: 3.5rem;
    }

    .field__devise {
      position: absolute;
      right: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: rgba(255,255,255,.4);
      font-size: 0.85rem;
      font-weight: 500;
      pointer-events: none;
    }

    .api-error {
      background: rgba(248,113,113,.1);
      border: 1px solid rgba(248,113,113,.3);
      border-radius: 10px;
      padding: 0.75rem 1rem;
      color: #f87171;
      font-size: 0.85rem;
    }

    .submit-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #0070f3, #00c9a7);
      color: #fff;
      border: none;
      border-radius: 14px;
      padding: 1rem;
      font-size: 1rem;
      font-weight: 700;
      font-family: inherit;
      cursor: pointer;
      transition: opacity .2s, transform .15s;
      box-shadow: 0 4px 20px rgba(0,112,243,.35);
    }

    .submit-btn:hover:not(:disabled) { opacity: .9; transform: translateY(-1px); }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { opacity: .45; cursor: not-allowed; }

    .submit-btn__spinner {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255,255,255,.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
      flex-shrink: 0;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    .transfer-meta {
      text-align: center;
    }

    .transfer-meta__from {
      color: rgba(255,255,255,.3);
      font-size: 0.78rem;
    }
  `],
})
export class TransferComponent {
  private walletState = inject(WalletStateService);
  private walletApi = inject(WalletApiService);
  private router = inject(Router);

  readonly balance = this.walletState.balance;
  readonly senderPhone = this.walletState.phone;
  readonly walletId = this.walletState.walletId;

  devise = signal('MAD');

  recipient = signal('');
  amount = signal<number | null>(null);

  recipientTouched = signal(false);
  amountTouched = signal(false);

  loading = signal(false);
  apiError = signal<string | null>(null);

  success = signal(false);
  lastRecipient = signal('');
  lastMontant = signal(0);

  readonly recipientError = computed(() => {
    const value = this.recipient().trim();
    if (!value) return 'Le numéro destinataire est requis';
    if (!/^[0-9]{10,15}$/.test(value)) return 'Format invalide (10 à 15 chiffres)';
    if (value === this.senderPhone()) return 'Le destinataire ne peut pas être vous-même';
    return null;
  });

  readonly amountError = computed(() => {
    const value = this.amount();
    if (value === null || value === undefined) return 'Le montant est requis';
    if (value <= 0) return 'Le montant doit être positif';
    if (value > this.balance()) return 'Montant supérieur au solde disponible';
    return null;
  });

  readonly canSubmit = computed(
    () =>
      !this.loading() &&
      !this.recipientError() &&
      !this.amountError() &&
      this.walletId() !== null
  );

  clearSuccess(): void {
    this.success.set(false);
    this.apiError.set(null);
  }

  goBack(): void {
    this.router.navigate(['/client']);
  }

  submit(): void {
    this.recipientTouched.set(true);
    this.amountTouched.set(true);

    if (!this.canSubmit()) return;

    const id = this.walletId()!;
    const toPhone = this.recipient().trim();
    const montant = this.amount()!;
    const phone = this.senderPhone();

    this.loading.set(true);
    this.apiError.set(null);
    this.success.set(false);

    this.walletApi
      .transfer(id, toPhone, montant)
      .pipe(switchMap(() => this.walletApi.getBalance(phone)))
      .subscribe({
        next: wallet => {
          this.walletState.setBalance(wallet.balance);
          this.lastRecipient.set(toPhone);
          this.lastMontant.set(montant);
          this.success.set(true);
          this.recipient.set('');
          this.amount.set(null);
          this.recipientTouched.set(false);
          this.amountTouched.set(false);
          this.loading.set(false);
        },
        error: err => {
          const msg: string = err?.error?.message ?? err?.message ?? 'Erreur lors du virement';
          this.apiError.set(msg);
          this.loading.set(false);
        },
      });
  }
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-billing-history',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="billing-history">
      <header class="billing-history__header">
        <button class="back-btn" routerLink="/dashboard">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Retour
        </button>
        <h1 class="billing-history__title">Historique des factures</h1>
        <div class="billing-history__spacer"></div>
      </header>

      <div class="empty-state">
        <p>L'historique des paiements de factures n'est pas encore disponible.</p>
        <button routerLink="/bills/current" class="primary-btn">Voir les factures impayées</button>
      </div>
    </div>
  `,
  styles: [`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    .billing-history {
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
      background-color: #f9fafb;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      color: #111827;
    }

    .billing-history__header {
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

    .billing-history__title {
      color: #111827;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }

    .billing-history__spacer {
      width: 80px; /* To balance the back button */
    }

    .empty-state {
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      padding: 3rem 1.5rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.5rem;
      box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
    }

    .empty-state p {
      color: #6b7280;
      margin: 0;
      font-size: 0.95rem;
    }

    .primary-btn {
      background: #2563eb;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.2s;
      text-decoration: none;
    }

    .primary-btn:hover {
      background: #1d4ed8;
    }
  `]
})
export class BillingHistoryComponent {}

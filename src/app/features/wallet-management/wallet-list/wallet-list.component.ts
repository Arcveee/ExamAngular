import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { WalletApiService } from '../../../core/services/wallet-api.service';
import { Wallet, Page } from '../../../core/models/models';
import { WalletSearchComponent } from '../wallet-search/wallet-search.component';

@Component({
  selector: 'app-wallet-list',
  standalone: true,
  imports: [DecimalPipe, DatePipe, WalletSearchComponent],
  template: `
    <div class="wallet-list">
      <h2 class="wallet-list__title">Portefeuilles</h2>
      
      <app-wallet-search></app-wallet-search>

      @if (loading()) {
        <p class="state-msg">Chargement…</p>
      } @else if (error()) {
        <p class="state-msg state-msg--error">Erreur lors du chargement des données.</p>
      } @else if (page()?.content?.length === 0) {
        <p class="state-msg">Aucun portefeuille trouvé.</p>
      } @else {
        <table class="table">
          <thead>
            <tr>
              <th>Téléphone</th>
              <th>Code</th>
              <th>Solde</th>
              <th>Devise</th>
              <th>Créé le</th>
            </tr>
          </thead>
          <tbody>
            @for (w of page()!.content; track w.id) {
              <tr>
                <td>{{ w.phoneNumber }}</td>
                <td>{{ w.code }}</td>
                <td>{{ w.balance | number: '1.2-2' }}</td>
                <td>{{ w.devise }}</td>
                <td>{{ w.createdAt | date: 'dd/MM/yyyy' }}</td>
              </tr>
            }
          </tbody>
        </table>

        <div class="pagination">
          <button [disabled]="currentPage() === 0" (click)="goTo(currentPage() - 1)">‹</button>
          <span>Page {{ currentPage() + 1 }} / {{ page()!.totalPages }}</span>
          <button [disabled]="currentPage() + 1 >= page()!.totalPages" (click)="goTo(currentPage() + 1)">›</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .wallet-list { max-width: 900px; }
    .wallet-list__title { margin-bottom: 1rem; color: #1a237e; }
    .state-msg { padding: 2rem; text-align: center; color: #666; }
    .state-msg--error { color: #c62828; }
    .table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.1); }
    .table th, .table td { padding: 0.75rem 1rem; text-align: left; border-bottom: 1px solid #e0e0e0; }
    .table th { background: #e8eaf6; font-weight: 600; color: #1a237e; }
    .table tr:last-child td { border-bottom: none; }
    .pagination { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; justify-content: flex-end; }
    .pagination button { padding: 0.25rem 0.75rem; cursor: pointer; border: 1px solid #1a237e; background: #fff; color: #1a237e; border-radius: 4px; font-size: 1rem; }
    .pagination button:disabled { opacity: 0.4; cursor: default; }
    .pagination span { font-size: 0.9rem; color: #555; }
  `],
})
export class WalletListComponent implements OnInit {
  private walletApi = inject(WalletApiService);

  readonly page = signal<Page<Wallet> | null>(null);
  readonly loading = signal(false);
  readonly error = signal(false);
  readonly currentPage = signal(0);
  private readonly pageSize = 10;

  ngOnInit(): void {
    this.load(0);
  }

  goTo(index: number): void {
    this.currentPage.set(index);
    this.load(index);
  }

  private load(pageIndex: number): void {
    this.loading.set(true);
    this.error.set(false);
    this.walletApi.getAll(pageIndex, this.pageSize).subscribe({
      next: data => {
        this.page.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}

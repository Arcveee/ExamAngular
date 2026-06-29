import { Routes } from '@angular/router';

export const WALLET_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./wallet-list/wallet-list.component').then(m => m.WalletListComponent),
  },
];

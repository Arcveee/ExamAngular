import { Routes } from '@angular/router';

export const DASHBOARD_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'transfer',
    loadComponent: () =>
      import('./transfer/transfer.component').then(m => m.TransferComponent),
  },
  {
    path: 'billing',
    loadComponent: () =>
      import('./billing/billing.component').then(m => m.BillingComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./history/history.component').then(m => m.HistoryComponent),
  },
];

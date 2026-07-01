import { Routes } from '@angular/router';
import { agentGuard } from './core/guards/agent.guard';
import { clientGuard } from './core/guards/client.guard';
import { ShellComponent } from './shared/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/role-selector/role-selector.component').then(
        m => m.RoleSelectorComponent
      ),
  },
  {
    path: '',
    component: ShellComponent,
    canActivate: [clientGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/dashboard/history/history.component').then(m => m.HistoryComponent),
      },
      {
        path: 'transfer',
        loadComponent: () => import('./features/dashboard/transfer/transfer.component').then(m => m.TransferComponent),
      },
      {
        path: 'bills',
        children: [
          { path: '', redirectTo: 'current', pathMatch: 'full' },
          {
            path: 'current',
            loadComponent: () => import('./features/dashboard/billing/billing.component').then(m => m.BillingComponent),
          },
          {
            path: 'history',
            loadComponent: () => import('./features/dashboard/billing-history/billing-history.component').then(m => m.BillingHistoryComponent),
          }
        ]
      }
    ]
  },
  {
    path: 'admin',
    component: ShellComponent,
    canActivate: [agentGuard],
    children: [
      {
        path: 'wallets',
        loadComponent: () => import('./features/wallet-management/wallet-list/wallet-list.component').then(m => m.WalletListComponent),
      }
    ]
  },
  { path: '**', redirectTo: '' },
];

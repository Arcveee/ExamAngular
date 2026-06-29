import { Routes } from '@angular/router';
import { agentGuard } from './core/guards/agent.guard';
import { clientGuard } from './core/guards/client.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/role-selector/role-selector.component').then(
        m => m.RoleSelectorComponent
      ),
  },
  {
    path: 'agent',
    canActivate: [agentGuard],
    loadChildren: () =>
      import('./features/wallet-management/wallet-management.routes').then(
        m => m.WALLET_MANAGEMENT_ROUTES
      ),
  },
  {
    path: 'client',
    canActivate: [clientGuard],
    loadChildren: () =>
      import('./features/dashboard/dashboard.routes').then(
        m => m.DASHBOARD_ROUTES
      ),
  },
  { path: '**', redirectTo: '' },
];

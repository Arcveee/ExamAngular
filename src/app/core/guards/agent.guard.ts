import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleService } from '../services/role.service';

export const agentGuard: CanActivateFn = () => {
  const role = inject(RoleService).role();
  if (role === 'agent') return true;
  return inject(Router).createUrlTree(['/']);
};

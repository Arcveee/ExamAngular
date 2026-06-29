import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RoleService } from '../services/role.service';

export const clientGuard: CanActivateFn = () => {
  const role = inject(RoleService).role();
  if (role === 'client') return true;
  return inject(Router).createUrlTree(['/']);
};

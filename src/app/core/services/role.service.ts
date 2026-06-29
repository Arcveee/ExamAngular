import { Injectable, signal } from '@angular/core';
import { UserRole } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoleService {
  private readonly _role = signal<UserRole>(
    (localStorage.getItem('role') as UserRole) ?? null
  );

  readonly role = this._role.asReadonly();

  setRole(role: UserRole): void {
    if (role) {
      localStorage.setItem('role', role);
    } else {
      localStorage.removeItem('role');
    }
    this._role.set(role);
  }
}

import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { UserRole } from '../../../core/models/models';

@Component({
  selector: 'app-role-selector',
  standalone: true,
  template: `
    <div>
      <h2>Choisir un espace</h2>
      <button (click)="select('agent')">Agent de guichet</button>
      <button (click)="select('client')">Client final</button>
    </div>
  `,
})
export class RoleSelectorComponent {
  constructor(private roleService: RoleService, private router: Router) {}

  select(role: UserRole): void {
    this.roleService.setRole(role);
    this.router.navigate([role === 'agent' ? '/agent' : '/client']);
  }
}

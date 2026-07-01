import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { RoleService } from '../../../core/services/role.service';
import { UserRole } from '../../../core/models/models';

@Component({
  selector: 'app-role-selector',
  standalone: true,
  template: `
    <div class="selector">
      <h1 class="selector__title">BadWallet</h1>
      <p class="selector__subtitle">Choisissez votre espace</p>
      <div class="selector__actions">
        <button class="btn btn--agent" (click)="select('agent')">Agent de guichet</button>
        <button class="btn btn--client" (click)="select('client')">Client final</button>
      </div>
    </div>
  `,
  styles: [`
    .selector {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      gap: 1rem;
    }
    .selector__title { font-size: 2rem; color: #1a237e; margin: 0; }
    .selector__subtitle { color: #555; margin: 0; }
    .selector__actions { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn {
      padding: 0.75rem 2rem;
      font-size: 1rem;
      border: none;
      border-radius: 6px;
      cursor: pointer;
    }
    .btn--agent { background: #1a237e; color: #fff; }
    .btn--client { background: #00695c; color: #fff; }
  `],
})
export class RoleSelectorComponent {
  private roleService = inject(RoleService);
  private router = inject(Router);

  select(role: UserRole): void {
    this.roleService.setRole(role);
    this.router.navigate([role === 'agent' ? '/agent' : '/client']);
  }
}

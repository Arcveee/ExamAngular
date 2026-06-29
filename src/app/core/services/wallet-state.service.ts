import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WalletStateService {
  private readonly _balance = signal<number>(0);
  readonly balance = computed(() => this._balance());

  setBalance(value: number): void {
    this._balance.set(value);
  }

  updateBalance(delta: number): void {
    this._balance.update(current => current + delta);
  }
}

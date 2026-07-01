import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WalletStateService {
  private readonly _balance = signal<number>(0);
  readonly balance = computed(() => this._balance());

  private readonly _phone = signal<string>(localStorage.getItem('clientPhone') ?? '');
  readonly phone = this._phone.asReadonly();

  private readonly _walletId = signal<number | null>(null);
  readonly walletId = this._walletId.asReadonly();

  setBalance(value: number): void {
    this._balance.set(value);
  }

  updateBalance(delta: number): void {
    this._balance.update(current => current + delta);
  }

  setPhone(phone: string): void {
    localStorage.setItem('clientPhone', phone);
    this._phone.set(phone);
  }

  setWalletId(id: number): void {
    this._walletId.set(id);
  }
}

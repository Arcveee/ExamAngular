import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Wallet, WalletDTO, Transaction, Page } from '../models/models';
import { toWallet } from '../models/adapters';

@Injectable({ providedIn: 'root' })
export class WalletApiService {
  private readonly base = `${environment.apiUrl}/api/wallets`;

  constructor(private http: HttpClient) {}

  getAll(page = 0, size = 10): Observable<Page<Wallet>> {
    return this.http
      .get<Page<WalletDTO>>(`${this.base}?page=${page}&size=${size}`)
      .pipe(map(p => ({ ...p, content: p.content.map(toWallet) })));
  }

  getByPhone(phone: string): Observable<Wallet> {
    return this.http
      .get<WalletDTO>(`${this.base}/phone/${phone}`)
      .pipe(map(toWallet));
  }

  create(phoneNumber: string, ownerName: string): Observable<Wallet> {
    return this.http
      .post<WalletDTO>(this.base, { phoneNumber, ownerName })
      .pipe(map(toWallet));
  }

  deposit(id: number, montant: number): Observable<Wallet> {
    return this.http
      .post<WalletDTO>(`${this.base}/${id}/depot`, { montant })
      .pipe(map(toWallet));
  }

  withdraw(id: number, montant: number): Observable<Wallet> {
    return this.http
      .post<WalletDTO>(`${this.base}/${id}/retrait`, { montant })
      .pipe(map(toWallet));
  }

  transfer(fromId: number, toPhone: string, montant: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${fromId}/transfert`, { toPhone, montant });
  }

  getHistory(id: number): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.base}/${id}/historique`);
  }
}

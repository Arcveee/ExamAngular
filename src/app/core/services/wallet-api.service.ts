import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
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
      .get<WalletDTO>(`${this.base}/${encodeURIComponent(phone)}`)
      .pipe(map(toWallet));
  }

  getBalance(phone: string): Observable<Wallet> {
    return this.http
      .get<WalletDTO>(`${this.base}/${encodeURIComponent(phone)}/balance`)
      .pipe(map(toWallet));
  }

  create(phoneNumber: string, ownerName: string): Observable<Wallet> {
    return this.http
      .post<WalletDTO>(this.base, { phoneNumber, ownerName })
      .pipe(map(toWallet));
  }

  deposit(id: number, amount: number, paymentMethod: string): Observable<Wallet> {
    return this.http
      .post<WalletDTO>(`${this.base}/${id}/deposit`, { amount, paymentMethod })
      .pipe(map(toWallet));
  }

  withdraw(phoneNumber: string, amount: number): Observable<Wallet> {
    return this.http
      .post<WalletDTO>(`${this.base}/withdraw`, { phoneNumber, amount })
      .pipe(map(toWallet));
  }

  transfer(senderPhone: string, receiverPhone: string, amount: number): Observable<void> {
    return this.http.post<void>(`${this.base}/transfer`, { senderPhone, receiverPhone, amount });
  }

  getTransactionsByPhone(phone: string): Observable<Transaction[]> {
    return this.http.get<Transaction[]>(`${this.base}/${encodeURIComponent(phone)}/transactions`);
  }

  payService(phoneNumber: string, serviceName: string, amount: number): Observable<void> {
    return this.http.post<void>(`${this.base}/pay`, { phoneNumber, serviceName, amount });
  }

  payFactures(phoneNumber: string, serviceName: string, factureReferences: string[]): Observable<void> {
    return this.http.post<void>(`${this.base}/pay-factures`, { phoneNumber, serviceName, factureReferences });
  }
}

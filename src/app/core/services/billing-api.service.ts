import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, switchMap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Facture } from '../models/models';

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  private readonly base = `${environment.apiUrl}/api/external/factures`;

  constructor(private http: HttpClient) {}

  getByPhone(phone: string): Observable<Facture[]> {
    return this.http
      .get<any[]>(`${this.base}/${phone}`)
      .pipe(map(list => list.map(this.toFacture)));
  }

  getCurrentFactures(provider?: string): Observable<Facture[]> {
    if (!provider) {
      // Load WOYAFAL and ISM in parallel and merge
      const woyafal$ = this.http
        .get<any[]>(`${this.base}/WOYAFAL/current`)
        .pipe(map(list => list.map(this.toFacture)));
      const ism$ = this.http
        .get<any[]>(`${this.base}/ISM/current`)
        .pipe(map(list => list.map(this.toFacture)));
      return woyafal$.pipe(
        switchMap(woy => ism$.pipe(map(ism => [...woy, ...ism])))
      );
    }
    return this.http
      .get<any[]>(`${this.base}/${provider}/current`)
      .pipe(map(list => list.map(this.toFacture)));
  }

  private toFacture(bill: any): Facture {
    return {
      id: bill.reference,
      reference: bill.reference,
      montant: Number(bill.amount),
      statut: bill.paid ? 'PAYEE' : 'IMPAYEE',
      emetteur: bill.provider,
      echeance: bill.billDate,
      unite: bill.provider,
    };
  }

  pay(factureId: string, walletId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${factureId}/payer`, { walletId });
  }
}

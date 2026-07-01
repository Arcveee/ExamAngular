import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Facture, FactureDTO } from '../models/models';
import { toFacture } from '../models/adapters';

@Injectable({ providedIn: 'root' })
export class BillingApiService {
  private readonly base = `${environment.apiUrl}/api/external/factures`;

  constructor(private http: HttpClient) {}

  getByPhone(phone: string): Observable<Facture[]> {
    return this.http
      .get<FactureDTO[]>(`${this.base}/${phone}`)
      .pipe(map(list => list.map(toFacture)));
  }

  getCurrentFactures(code: string, unite?: string): Observable<Facture[]> {
    let params = new HttpParams();
    if (unite) {
      params = params.set('unite', unite);
    }
    return this.http
      .get<FactureDTO[]>(`${this.base}/${code}/current`, { params })
      .pipe(map(list => list.map(toFacture)));
  }

  pay(factureId: string, walletId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${factureId}/payer`, { walletId });
  }
}

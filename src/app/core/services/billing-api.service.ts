import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

  pay(factureId: string, walletId: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${factureId}/payer`, { walletId });
  }
}

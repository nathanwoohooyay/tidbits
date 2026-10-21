import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PricingQuoteDTO {
  instrumentId: number;
  symbol: string;
  price: number;
  change: number;
  bid: number;
  ask: number;
  changePercent: number;
  prevClose: number;
  currency: string;
  asOf: string;
  stale: boolean;
  source: string;
}

export interface GetHoldingsResponseDTO {
  asOf: string;
  quotes: PricingQuoteDTO[];
}

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private http = inject(HttpClient);
  private readonly apiBase = '/api/pricing';

  getQuotes(symbols: string): Observable<GetHoldingsResponseDTO> {
    const params = new HttpParams().set('symbols', symbols);
    return this.http.get<GetHoldingsResponseDTO>(`${this.apiBase}/quotes`, { params });
  }

}

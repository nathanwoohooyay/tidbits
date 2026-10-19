import { CommonModule } from '@angular/common';
import {Component, EventEmitter, inject, Input, OnInit, Output, signal} from '@angular/core';
import { Holding, TradeMode } from './dashboard.models';
import { formatCurrency, formatPercent } from './dashboard.utils';
import {AccountService, AccountHoldingDto} from '../../services/account.service';
import {PricingService, GetHoldingsResponseDTO, PricingQuoteDTO} from '../../services/pricing.service';
import { tickerToName } from './stock';
import { map } from 'rxjs';

export interface HoldingDTO {
  holding_id: number;
  instrument_id: number;
  quantity: number;
  amount_invested: number;
  ticker: string;
  name: string;
  currentPrice: number;
  changePercent: number;
  totalValue: number;
  changeValue: number;
}

@Component({
  selector: 'app-dashboard-holdings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-holdings.component.html'
})
export class DashboardHoldingsComponent implements OnInit {
  @Output() quickTrade = new EventEmitter<{ instrumentId: number; mode: TradeMode }>();
  @Output() portfolioValue = new EventEmitter<number>();
   @Output() portfolioChange = new EventEmitter<number>();

  private _selectedAccountId: number | null = null;

  @Input()
  set selectedAccountId(value: number | null) {
    this._selectedAccountId = value;
    if (value != null && value > 0) {
      this.loadHoldings(value);
    }
  }

  get selectedAccountId(): number | null {
    return this._selectedAccountId;
  }

  readonly formatCurrency = formatCurrency;
  readonly formatPercent = formatPercent;

  private readonly accountService = inject(AccountService);
  private readonly pricingService = inject(PricingService);

  stockTickers = Array.from(tickerToName.keys());
  stockNames = Array.from(tickerToName.values());
  expandedHoldingsArray = signal<HoldingDTO[]>([]);

  holdingsArrayLoading = signal(false);
  holdingsArrayError = signal('');

  ngOnInit(){
    this.holdingsArrayLoading.set(true);

  }


 loadHoldings(accountId: number) {
  // clear the array
  this.expandedHoldingsArray.set([]);
   this.accountService.listHoldings(accountId).subscribe({
        next: holdingsArray => {
          console.log(holdingsArray);

         let totalInvested=0;
         let totalValue=0;
         let totalChangeVal = 0;

          holdingsArray.forEach(holding => {
            const ticker = this.stockTickers[holding.instrumentId - 1];

            this.getMarketData(ticker).subscribe({
              next: marketInfo => {
                const calculatedInfo = this.calculateHoldingGains(
                  holding.quantity,
                  holding.amountInvested,
                  marketInfo.marketPrice
                );

                const expandedHolding: HoldingDTO = {
                  holding_id: holding.holdingId,
                  instrument_id: holding.instrumentId,
                  quantity: holding.quantity,
                  ticker: ticker,
                  name: this.stockNames[holding.instrumentId - 1],
                  amount_invested: holding.amountInvested,
                  currentPrice: marketInfo.marketPrice,
                  totalValue: calculatedInfo.marketValue,
                  changeValue: calculatedInfo.changeValue,
                  changePercent: calculatedInfo.changePercent
                };

                this.expandedHoldingsArray.update(array => [...array, expandedHolding]);
                console.log(expandedHolding);

                totalInvested+=holding.amountInvested;
                totalValue+=calculatedInfo.marketValue;
                        console.log(totalInvested);
                        console.log(totalValue);
                        totalChangeVal=((totalValue-totalInvested)/totalInvested)*100;

                        this.portfolioValue.emit(totalValue);
                        this.portfolioChange.emit(totalChangeVal);
              },
              error: err => {
                console.log('Failed to fetch market price', err);
              }
            });
          });

        },
      error:err=>{
        this.holdingsArrayError.set(err?.error?.message ?? 'Failed to load holdings.');
        this.expandedHoldingsArray.set([]);
        },
      complete:()=>{
                this.holdingsArrayLoading.set(false);
        }
      });}

  getMarketData(symbols:string ){
    console.log("Getting market data...");
      return this.pricingService.getQuotes(symbols).pipe(
        map((resp: GetHoldingsResponseDTO) => ({
          marketPrice: resp.quotes[0].price,
          ticker: resp.quotes[0].symbol
        }))
      );
  }

  calculateHoldingGains(quantity:number, amountInvested:number, marketPrice:number){
      const marketValue = marketPrice*quantity;
      const changeValue = marketValue-amountInvested;
      const changePercent = ((marketValue-amountInvested)/amountInvested)*100;
      return  { marketValue, changeValue, changePercent };
      }

  }


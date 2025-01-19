import { OnixPriceType } from '@onix/types/enums';

export interface OnixPrice {
  /**
   * priceType (CodeList 58), e.g. 2=RRP incl. tax
   */
  priceType?: OnixPriceType | number;
  priceAmount?: number; // e.g. 285
  currencyCode?: string; // e.g. "UAH"
  tax?: {
    taxType?: number; // CodeList 171, e.g. 1=VAT
    taxRatePercent?: number; // e.g. 0
  };
}

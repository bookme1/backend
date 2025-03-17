import { OnixProductAvailability } from '@onix/types/enums';
import { OnixPrice, OnixSupplier } from '.';

export interface OnixSupplyDetail {
  supplier?: OnixSupplier;
  productAvailability?: OnixProductAvailability | number;
  price?: OnixPrice;
}

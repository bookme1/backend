import { Expose } from 'class-transformer';
import { IsArray } from 'class-validator';

export class CreateOrderDTO {
  @IsArray()
  @Expose()
  books: string[]; // ids

  @Expose()
  order_id: string; // in order to make pay process instant -> generating order id on frontend
}

export enum Status {
  Unknown = 'Unknown',
  Created = 'Created',
  Loading = 'Loading',
  Cancelled = 'Cancelled',
  Error = 'Error',
  Succeed = 'Succeed',
  Success = 'Success',
}

export class IOrderBook {
  reference_number: string;
  ordered_formats: string;
  transaction_id: string;
}

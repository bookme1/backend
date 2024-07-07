import { Expose, Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

class OrderBookDTO {
  @IsString()
  reference_number: string;

  @IsString()
  ordered_formats: string;

  @IsString()
  transaction_id: string;
}

export class CreateOrderDTO {
  @IsString()
  @Expose()
  order_id: string;

  @IsArray()
  @Expose()
  @ValidateNested({ each: true })
  @Type(() => OrderBookDTO)
  orderBooks: OrderBookDTO[];

  @IsNumber()
  @Expose()
  amount: number;
}

export enum Status {
  Unknown = 'Unknown',
  Created = 'Created',
  Loading = 'Loading',
  Cancelled = 'Cancelled',
  Succeed = 'Succeed',
}

export class IOrderBook {
  reference_number: string;
  ordered_formats: string;
  transaction_id: string;
}

import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';

export enum BookType {
  Fav = 'fav',
  Cart = 'cart',
}

export class GetUserBooksDTO {
  @Expose()
  @IsNotEmpty()
  type: BookType;
}

export class UserBooksDTO {
  @Expose()
  @IsOptional()
  bookId?: string;

  @Expose()
  @IsNotEmpty()
  type: BookType;
}

import { Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export enum BookType {
  Fav = 'Fav',
  Cart = 'Cart',
}

export class GetUserBooksDTO {
  @Expose()
  @IsNotEmpty()
  type: BookType;
}

export class UserBooksDTO {
  @Expose()
  @IsNotEmpty()
  bookId: string;

  @Expose()
  @IsNotEmpty()
  type: BookType;
}

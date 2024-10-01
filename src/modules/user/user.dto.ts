import { Expose } from 'class-transformer';
import { IsNotEmpty, IsOptional } from 'class-validator';
import { Book } from 'src/db/Book';

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
  @IsOptional()
  bookId?: string;

  @Expose()
  @IsOptional()
  book?: Book;

  @Expose()
  @IsNotEmpty()
  type: BookType;
}

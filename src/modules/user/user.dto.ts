import { Expose } from 'class-transformer';
import { IsNotEmpty } from 'class-validator';

export class bookIdDto {
  @Expose()
  @IsNotEmpty()
  bookId!: string;
}

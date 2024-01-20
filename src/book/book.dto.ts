import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SaveBookDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  title!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  url!: string;

  @Expose()
  @IsNumber()
  @IsNotEmpty()
  price!: number;

  @Expose()
  @IsString()
  @IsNotEmpty()
  author!: string;
}

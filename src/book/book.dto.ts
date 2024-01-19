import { Expose } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SaveBookDto {
  @Expose()
  @IsEmail()
  @IsNotEmpty()
  title!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  url!: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  price!: string;
}

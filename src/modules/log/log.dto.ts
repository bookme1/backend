import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class SaveLogDto {
  @Expose()
  @IsString()
  @IsNotEmpty()
  source: string;

  @Expose()
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  code?: number;
}

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

  @IsString()
  context?: string;

  @IsNumber()
  code?: number;
}

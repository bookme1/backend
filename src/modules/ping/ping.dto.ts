import { Expose } from 'class-transformer';
import { IsString } from 'class-validator';

export class PingDTO {
  @Expose()
  transactionId: string;

  @Expose()
  @IsString()
  statusLink!: string;

  @IsString()
  epubLink!: string | null;

  @IsString()
  mobiLink!: string | null;

  @IsString()
  pdfLink!: string | null;
}

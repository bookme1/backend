import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export enum Filter {
  pop,
  low,
  high,
}

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

export class EditBookDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title!: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  url!: string;

  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  price!: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  author!: string;
}

export class FindBookDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  type!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  value!: string;
}

export class FilterBookDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  filter!: Filter;

  @ApiProperty({ required: false })
  @IsOptional()
  @Expose()
  @IsString()
  cover!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Expose()
  @IsString()
  author!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Expose()
  @IsString()
  lang!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @Expose()
  @IsString()
  pub!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  minPrice!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  maxPrice!: number;
}

export class deliverDTO {
  transactionId: string;
}

export class WatermarkDTO {
  @Expose()
  formats: string;
  @Expose()
  reference_number: string;
  @Expose()
  order_id: string;
}

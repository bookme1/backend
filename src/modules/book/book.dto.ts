import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsBoolean,
} from 'class-validator';

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
  @Expose()
  page: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : decodeURIComponent(value)
          .split(',')
          .map((val) => val.trim()),
  )
  @IsString({ each: true })
  authors?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : decodeURIComponent(value)
          .split(',')
          .map((val) => val.trim()),
  )
  @IsString({ each: true })
  publishers?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : decodeURIComponent(value)
          .split(',')
          .map((val) => val.trim()),
  )
  @IsString({ each: true })
  genre?: string[];

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value
      : decodeURIComponent(value)
          .split(',')
          .map((val) => val.trim()),
  )
  @IsString({ each: true })
  languages?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  minPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  maxPrice?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  selectReferenceAndTitle?: boolean;
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

export class CartWatermarkDTO {
  @Expose()
  order_id: string;
}

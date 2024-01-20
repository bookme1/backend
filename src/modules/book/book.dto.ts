import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

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

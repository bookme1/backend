import { PartialType } from '@nestjs/swagger';
import { CreateBooksetDto } from './create-bookset.dto';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateBooksetDto extends PartialType(CreateBooksetDto) {
    @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  books?: number[];  

  @IsOptional()
  header: {
    @IsOptional()
    @IsNumber()
    editedBy?: number;
  };
}

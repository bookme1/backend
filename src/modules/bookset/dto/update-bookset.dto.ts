import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateBooksetDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  books?: number[];

  @IsOptional()
  header: {
    editedBy?: number;
  };
}

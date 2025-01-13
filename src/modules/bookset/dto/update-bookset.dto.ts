import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateBooksetDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsArray()
  books?: string[];

  @IsOptional()
  header: {
    editedBy?: number;
  };
}

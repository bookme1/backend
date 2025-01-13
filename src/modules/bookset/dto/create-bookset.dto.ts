import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateBooksetDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  books: string[];

  @IsNotEmpty()
  header: {
    createdBy: number;
    createdAt: Date;
  };
}

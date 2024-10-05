import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class CreateBooksetDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  books: number[];

  @IsNotEmpty()
  header: {
    createdBy: number;
    createdAt: Date;
  };
}

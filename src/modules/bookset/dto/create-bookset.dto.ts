import { IsArray, IsNotEmpty, IsNumber, IsString } from "class-validator";

export class CreateBooksetDto {
    @IsString()
  @IsNotEmpty()
  title: string;

  @IsArray()
  books: number[]; // Массив ID книг

  @IsNotEmpty()
  header: {
    @IsNumber()
    createdBy: number;

    @IsNotEmpty()
    createdAt: Date;
  };
}

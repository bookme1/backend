import { IsNotEmpty, IsString } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Book {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  url: string;

  @Column({ default: 0 })
  @IsNotEmpty()
  price: number;

  @Column()
  @IsString()
  @IsNotEmpty()
  author: string;
}

import { IsNotEmpty, IsString } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity()
@Unique(['title'])
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '' })
  art!: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column()
  @IsString()
  url!: string;

  @Column({ default: 0 })
  price!: number;

  @Column({ default: 0 })
  pages!: number;

  @Column({ default: 'ua' })
  lang!: string;

  @Column({ default: '' })
  desc!: string;

  @Column({ default: '' })
  cover!: string;

  @Column({ default: '' })
  @IsString()
  author!: string;

  @Column({ default: '' })
  @IsString()
  pub!: string;
}

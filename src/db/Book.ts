import { IsNotEmpty, IsString } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
//@Unique(['title'])
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '' })
  @IsString()
  referenceNumber: string;

  @Column({ default: '' })
  art!: string;

  @Column()
  @IsString()
  @IsNotEmpty()
  title: string;

  @Column()
  @IsString()
  url!: string;

  @Column({ default: '' })
  price!: string;

  @Column({ default: 0 })
  pages!: number;

  @Column({ default: 'ua' })
  lang!: string;

  @Column({ default: '' })
  desc!: string;

  @Column({ default: '' })
  @IsString()
  author!: string;

  @Column({ default: '' })
  @IsString()
  pub!: string;

  @Column({ default: '' })
  @IsString()
  pubDate!: string;

  @Column({ default: '' })
  @IsString()
  genre!: string;

  @Column({ default: '' })
  @IsString()
  formatMobi!: string;

  @Column({ default: '' })
  @IsString()
  formatPdf!: string;

  @Column({ default: '' })
  @IsString()
  formatEpub!: string;
}

import { IsString } from 'class-validator';
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Ping {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  transactionId: string;

  @Column({ default: 0 })
  status!: number;

  @Column({ default: '' })
  @IsString()
  statusLink!: string;

  @Column({ default: null })
  @IsString()
  epubLink!: string | null;

  @Column({ default: null })
  @IsString()
  mobiLink!: string | null;

  @Column({ default: null })
  @IsString()
  pdfLink!: string | null;
}

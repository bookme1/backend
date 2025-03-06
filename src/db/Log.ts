import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class Log {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ default: '' })
  @IsString()
  @IsNotEmpty()
  source: string;

  @Column({ default: '' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsNumber()
  @IsNotEmpty()
  code?: number; // Code regarding internal code system

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;
}

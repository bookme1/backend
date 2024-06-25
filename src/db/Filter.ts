import { ArrayNotEmpty, IsArray, IsNumber, IsString } from 'class-validator';
import { Entity, Column } from 'typeorm';

@Entity()
export class Filter {
  @Column({ default: 0 })
  @IsNumber()
  priceMin: number;

  @Column({ default: 0 })
  @IsNumber()
  priceMax: number;

  @Column('simple-array')
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  authors: string[];

  @Column('simple-array')
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  publishHouses: string[];

  @Column('simple-array')
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  languages: string[];
}

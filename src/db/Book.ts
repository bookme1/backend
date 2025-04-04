import { IsNotEmpty, IsString } from 'class-validator';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { OrderBook } from './OrderBook';
import { Bookset } from 'src/db/Bookset';

class OriginalBook {
  referenceNumber: string;
  art: string;
  title: string;
  url: string;
  price: string;
  pages: number;
  lang: string;
  desc: string;
  author: string;
  pub: string;
  pubDate: string;
  genre: string;
  formatMobi: string;
  formatPdf: string;
  formatEpub: string;
}

class Header {
  createdAt: string;
  originalModifiedAt: string;
  modifiedAt: string;
  modifiedBy: number;
}

@Entity()
//@Unique(['title'])
export class Book {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'json', default: {} })
  header: Header;

  @Column({ type: 'json', default: {} })
  original: OriginalBook;

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

  @Column({ default: 0 })
  price!: number;

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

  @OneToMany(() => OrderBook, (orderBook) => orderBook.book)
  orderBooks: OrderBook[];

  @ManyToMany(() => Bookset, (bookSet) => bookSet.books)
  bookSets: Bookset[];
}

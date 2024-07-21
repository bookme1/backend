import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Order } from './Order';
import { Book } from './Book';
import { IsString } from 'class-validator';
import { Status } from './types';

@Entity()
export class OrderBook {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: string;

  @ManyToOne(() => Order, (order) => order.order_id)
  @JoinColumn({ name: 'orderId' }) // Specify that this column is the foreign key
  order: Order;

  @ManyToOne(() => Book, (book) => book.orderBooks, { eager: true })
  book: Book;

  @Column()
  orderedFormats: string;

  @Column()
  transId: string;

  @Column({ default: null })
  @IsString()
  epubLink!: string | null;

  @Column({ default: null })
  @IsString()
  mobiLink!: string | null;

  @Column({ default: null })
  @IsString()
  pdfLink!: string | null;

  @Column({ default: Status.Created })
  status: Status | null; // Created by default, succeed when links were assigned
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Order } from './Order';
import { Book } from './Book';

@Entity()
export class OrderBook {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Order, (order) => order.orderBooks)
  order: Order;

  @ManyToOne(() => Book, (book) => book.orderBooks, { eager: true })
  book: Book;

  @Column()
  orderedFormats: string;

  @Column()
  transId: string;
}

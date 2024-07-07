import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Status } from './types';
import { User } from './User';
import { OrderBook } from './OrderBook';

@Entity()
export class Order {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'uuid', unique: true, default: null })
  order_id: string;

  @Column({ default: Status.Unknown })
  status: Status;

  @OneToMany(() => OrderBook, (orderBook) => orderBook.order, {
    cascade: true,
    eager: true,
  })
  orderBooks: OrderBook[];

  @ManyToOne(() => User, (user) => user.orders) // Define relations many (orders) to one (user)
  user!: User;

  @Column({ default: 0 })
  amount: number;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP', // Default to current timestamp
    nullable: false,
  })
  createdAt: Date;
}

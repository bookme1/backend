import { encrypt } from 'src/helpers/encryption';
import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Role } from './types';
import { Order } from './Order';
import { Book } from './Book';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('boolean', {
    default: false,
    nullable: false,
  })
  verified: boolean; // If user's email verified or not

  @Column('varchar', {
    unique: false,
    nullable: true,
  })
  username: string;

  @Column('varchar', {
    nullable: true,
    unique: true,
    transformer: encrypt,
  })
  email!: string | null;

  @Column('varchar', {
    unique: false,
    nullable: true,
    transformer: encrypt,
  })
  password!: string | null;

  @Column('varchar', {
    default: Role.User,
    nullable: false,
  })
  role: Role; // Role to manage restrictions

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP', // Default to current timestamp
    nullable: false,
  })
  lastActiveAt: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP', // Default to current timestamp
    nullable: false,
  })
  createdAt: Date;

  @ManyToMany(() => Book, { eager: true })
  @JoinTable()
  fav: Book[]; // books in favorite

  @ManyToMany(() => Book, { eager: true })
  @JoinTable()
  cart: Book[]; // books in cart

  @Column('varchar', { array: true, default: [], nullable: false })
  books: string[]; // owned books

  @OneToMany(() => Order, (order) => order.user, { eager: true }) // Define relations one to many
  orders: Order[];
}

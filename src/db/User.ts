import { encrypt } from 'src/helpers/encryption';
import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Role } from './types';
import { Order } from './Order';

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

  @Column('varchar', { array: true, default: [], nullable: false })
  fav: string[]; // books in favorite

  @Column('varchar', { array: true, default: [], nullable: false })
  cart: string[]; // books in cart

  @Column('varchar', { array: true, default: [], nullable: false })
  books: string[]; // owned books

  @OneToMany(() => Order, (order) => order.user, { eager: true }) // Define relations one to many
  orders: Order[];
}

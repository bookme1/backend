import { encrypt } from 'src/helpers/encryption';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Role } from './types';

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
  username!: string | null;

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
    unique: false,
    nullable: false,
  })
  role: Role; // Role to manage restrictions

  @Column('varchar', { array: true, default: [], nullable: false })
  fav: string[]; // books in favorite

  @Column('varchar', { array: true, default: [], nullable: false })
  cart: string[]; // books in cart

  @Column('varchar', { array: true, default: [], nullable: false })
  books: string[]; // owned books
}

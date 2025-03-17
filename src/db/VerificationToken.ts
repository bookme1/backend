import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
@Entity()
export class VerificationToken {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  token: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn()
  user: User; // who is owner of that token?

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP', // Default to current timestamp
    nullable: false,
  })
  createdAt: Date;

  @Column({
    type: 'timestamp',
  })
  expiresAt: Date;
}

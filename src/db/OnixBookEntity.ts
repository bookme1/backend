import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { OnixNotificationType } from '@onix/types/enums';

@Entity('onix_books')
export class OnixBookEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  recordReference: string; // A unique ID for the product record

  @Column({ type: 'enum', enum: OnixNotificationType, nullable: true })
  notificationType?: OnixNotificationType;

  @Column({ type: 'jsonb', nullable: true })
  productIdentifiers?: any;

  @Column({ type: 'jsonb', nullable: true })
  descriptiveDetail?: any;

  @Column({ type: 'jsonb', nullable: true })
  collateralDetail?: any;

  @Column({ type: 'jsonb', nullable: true })
  publishingDetail?: any;

  @Column({ type: 'jsonb', nullable: true })
  productionDetail?: any;

  @Column({ type: 'jsonb', nullable: true })
  productSupply?: any;

  @Column({ type: 'varchar', nullable: true })
  lastUpdatedBy?: string; // Who updated record, e.g. "system", "manual"

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

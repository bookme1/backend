import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToMany,
  JoinTable,
  BeforeUpdate,
} from 'typeorm';
import { Book } from './Book';

@Entity()
export class Bookset {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @ManyToMany(() => Book, (book) => book.bookSets)
  @JoinTable()
  books: Book[];

  @Column('json', { nullable: false })
  header: {
    createdBy: number;
    createdAt: Date;
    editedBy?: number;
    editedAt?: Date;
  };

  @BeforeUpdate()
  updateEditedFields() {
    this.header.editedAt = new Date();
  }
}

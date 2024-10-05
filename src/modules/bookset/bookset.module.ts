import { Module } from '@nestjs/common';
import { BooksetService } from './bookset.service';
import { BooksetController } from './bookset.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bookset } from './entities/bookset.entity';
import { Book } from 'src/db/Book';
import { BooksService } from '../book/book.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bookset, Book])],
  controllers: [BooksetController],
  providers: [BooksetService, BooksService],
})
export class BooksetModule {}

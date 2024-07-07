import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './book.service';
import { BooksController } from './book.controller';
import { Book } from 'src/db/Book';
import { HttpModule } from '@nestjs/axios';
import { Order } from 'src/db/Order';

@Module({
  imports: [TypeOrmModule.forFeature([Book, Order]), HttpModule],
  providers: [BooksService],
  controllers: [BooksController],
  exports: [TypeOrmModule],
})
export class BooksModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './book.service';
import { BooksController } from './book.controller';
import { Book } from 'src/db/Book';
import { HttpModule } from '@nestjs/axios';
import { Order } from 'src/db/Order';
import { User } from 'src/db/User';
import { OrderBook } from 'src/db/OrderBook';
import { OnixService } from '../onix/onix.service';
import { OnixBookEntity } from 'src/db/OnixBookEntity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, Order, User, OrderBook, OnixBookEntity]),
    HttpModule,
  ],
  providers: [BooksService, OnixService],
  controllers: [BooksController],
  exports: [TypeOrmModule],
})
export class BooksModule {}

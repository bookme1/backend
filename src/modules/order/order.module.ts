import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { BooksModule } from '../book/book.module';
import { Order } from 'src/db/Order';
import { User } from 'src/db/User';
import { Book } from 'src/db/Book';

@Module({
  imports: [TypeOrmModule.forFeature([Order, User, Book]), BooksModule],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [TypeOrmModule],
})
export class OrderModule {}

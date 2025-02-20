import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { BooksModule } from '../book/book.module';
import { Order } from 'src/db/Order';
import { User } from 'src/db/User';
import { Book } from 'src/db/Book';
import { BooksService } from '../book/book.service';
import { HttpModule } from '@nestjs/axios';
import { OrderBook } from 'src/db/OrderBook';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, Book, OrderBook]),
    BooksModule,
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [OrderService, BooksService],
  controllers: [OrderController],
  exports: [TypeOrmModule],
})
export class OrderModule {}

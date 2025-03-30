import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { BooksModule } from '../book/book.module';
import { Order } from 'src/db/Order';
import { User } from 'src/db/User';
import { Book } from 'src/db/Book';
import { HttpModule } from '@nestjs/axios';
import { OrderBook } from 'src/db/OrderBook';
import { JwtModule } from '@nestjs/jwt';
import { LogsModule } from '../log/log.module';
import { Log } from 'src/db/Log';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, User, Book, OrderBook, Log]),
    forwardRef(() => BooksModule),
    HttpModule,
    LogsModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService, TypeOrmModule],
})
export class OrderModule {}

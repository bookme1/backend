import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './book.service';
import { BooksController } from './book.controller';
import { Book } from 'src/db/Book';
import { HttpModule } from '@nestjs/axios';
import { Order } from 'src/db/Order';
import { User } from 'src/db/User';
import { OrderBook } from 'src/db/OrderBook';
import { JwtModule } from '@nestjs/jwt';
import { LogsModule } from '../log/log.module';
import { Log } from 'src/db/Log';
import { OnixService } from '../onix/onix.service';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, User, OrderBook, Log, Order]),
    LogsModule,
    HttpModule,
    forwardRef(() => OrderModule),
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [BooksService, OnixService],
  controllers: [BooksController],
  exports: [BooksService, TypeOrmModule],
})
export class BooksModule {}

import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, Order, User, OrderBook, Log]),
    LogsModule,
    HttpModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [BooksService],
  controllers: [BooksController],
  exports: [TypeOrmModule],
})
export class BooksModule {}

import { Module } from '@nestjs/common';
import { BooksetService } from './bookset.service';
import { BooksetController } from './bookset.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bookset } from 'src/db/Bookset';
import { Book } from 'src/db/Book';
import { BooksService } from '../book/book.service';
import { BooksModule } from '../book/book.module';
import { HttpModule } from '@nestjs/axios';
import { Log } from 'src/db/Log';
import { LogsModule } from '../log/log.module';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bookset, Book, Log]),
    BooksModule,
    OrderModule,
    HttpModule,
    LogsModule,
  ],
  controllers: [BooksetController],
  providers: [BooksetService, BooksService],
  exports: [TypeOrmModule],
})
export class BooksetModule {}

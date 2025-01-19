import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksModule } from '../book/book.module';
import { Book } from 'src/db/Book';
import { OnixController } from './onix.controller';
import { OnixService } from './onix.service';

@Module({
  imports: [TypeOrmModule.forFeature([Book]), BooksModule],
  providers: [OnixService],
  controllers: [OnixController],
  exports: [TypeOrmModule],
})
export class OnixModule {}

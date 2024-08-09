import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterService } from './filter.service';
import { FilterController } from './filter.controller';
import { Filter } from 'src/db/Filter';
import { Book } from 'src/db/Book';
import { BooksModule } from '../book/book.module';

@Module({
  imports: [TypeOrmModule.forFeature([Filter, Book]), BooksModule],
  providers: [FilterService],
  controllers: [FilterController],
  exports: [TypeOrmModule],
})
export class FilterModule {}

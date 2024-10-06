import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterService } from './filter.service';
import { FilterController } from './filter.controller';
import { Filter } from 'src/db/Filter';
import { BooksModule } from '../book/book.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [TypeOrmModule.forFeature([Filter]), BooksModule, RedisModule],
  providers: [FilterService],
  controllers: [FilterController],
  exports: [TypeOrmModule],
})
export class FilterModule {}

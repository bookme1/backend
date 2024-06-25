import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FilterService } from './filter.service';
import { FilterController } from './filter.controller';
import { Filter } from 'src/db/Filter';

@Module({
  imports: [TypeOrmModule.forFeature([Filter])],
  providers: [FilterService],
  controllers: [FilterController],
  exports: [TypeOrmModule],
})
export class FilterModule {}

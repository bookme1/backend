import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnixController } from './onix.controller';
import { OnixService } from './onix.service';
import { OnixBookEntity } from 'src/db/OnixBookEntity';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    TypeOrmModule.forFeature([OnixBookEntity]),
    ScheduleModule.forRoot(),
  ],
  providers: [OnixService],
  controllers: [OnixController],
  exports: [TypeOrmModule],
})
export class OnixModule {}

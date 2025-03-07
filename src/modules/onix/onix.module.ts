import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OnixController } from './onix.controller';
import { OnixService } from './onix.service';
import { OnixBookEntity } from 'src/db/OnixBookEntity';
import { ScheduleModule } from '@nestjs/schedule';
import { LogsModule } from '../log/log.module';
import { Log } from 'src/db/Log';

@Module({
  imports: [
    TypeOrmModule.forFeature([OnixBookEntity, Log]),
    ScheduleModule.forRoot(),
    LogsModule,
  ],
  providers: [OnixService],
  controllers: [OnixController],
  exports: [TypeOrmModule],
})
export class OnixModule {}

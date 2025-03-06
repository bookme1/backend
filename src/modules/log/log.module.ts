import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Log } from 'src/db/Log';
import { LogsService } from './log.service';
import { LogsController } from './log.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Log])],
  providers: [LogsService],
  controllers: [LogsController],
  exports: [LogsService, TypeOrmModule],
})
export class LogsModule {}

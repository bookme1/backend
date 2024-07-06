import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PingService } from './ping.service';
import { PingController } from './ping.controller';
import { Ping } from 'src/db/Ping';

@Module({
  imports: [TypeOrmModule.forFeature([Ping])],
  providers: [PingService],
  controllers: [PingController],
  exports: [TypeOrmModule],
})
export class PingModule {}

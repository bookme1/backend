import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PingService } from './ping.service';
import { PingController } from './ping.controller';
import { Ping } from 'src/db/Ping';
import { OrderService } from '../order/order.service';
import { OrderModule } from '../order/order.module';
import { LogsService } from '../log/log.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ping]), OrderModule],
  providers: [PingService, OrderService, LogsService],
  controllers: [PingController],
  exports: [TypeOrmModule],
})
export class PingModule {}

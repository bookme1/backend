import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PingService } from './ping.service';
import { PingController } from './ping.controller';
import { Ping } from 'src/db/Ping';
import { OrderService } from '../order/order.service';
import { OrderModule } from '../order/order.module';

@Module({
  imports: [TypeOrmModule.forFeature([Ping]), OrderModule],
  providers: [PingService, OrderService],
  controllers: [PingController],
  exports: [TypeOrmModule],
})
export class PingModule {}

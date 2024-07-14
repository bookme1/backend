import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PingService } from './ping.service';
import { OrderService } from '../order/order.service';

@ApiTags('ping')
@Controller('api/ping')
export class PingController {
  constructor(
    private readonly pingService: PingService,
    private readonly orderService: OrderService,
  ) {}

  @Get('')
  async getAllPings() {
    return await this.pingService.getAllPings();
  }

  @Post('')
  async acceptPing(@Body() body: any) {
    try {
      const ping = await this.pingService.acceptPing(body);

      return await this.orderService.orderDelievered(ping);
    } catch (error) {
      throw new BadRequestException();
    }
  }
}

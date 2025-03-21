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
import { LogsService } from '../log/log.service';

@ApiTags('ping')
@Controller('api/ping')
export class PingController {
  constructor(
    private readonly pingService: PingService,
    private readonly orderService: OrderService,
    private logsService: LogsService,
  ) {}

  @Get('')
  async getAllPings() {
    return await this.pingService.getAllPings();
  }

  @Post('')
  async acceptPing(@Body() body: any) {
    try {
      await this.logsService.save({
        source: 'PING',
        message: 'PING: POST',
        code: 1010,
        context: body,
      });
      const ping = await this.pingService.acceptPing(body);

      return await this.orderService.orderDelievered(ping);
    } catch (error) {
      await this.logsService.save({
        source: 'PING',
        message: 'ERROR. PING POST. ' + body,
        code: 1010,
        context: error,
      });
      throw new BadRequestException();
    }
  }
}

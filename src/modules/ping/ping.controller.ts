import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PingService } from './ping.service';
import { PingDTO } from './ping.dto';

@ApiTags('ping')
@Controller('api/ping')
export class PingController {
  constructor(private readonly pingService: PingService) {}

  @Post()
  async acceptPing(@Body() body: PingDTO) {
    try {
      await this.pingService.acceptPing(body);
      return { status: 'success' };
    } catch (error) {
      throw new BadRequestException();
    }
  }
}

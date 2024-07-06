import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PingService } from './ping.service';
import { PingDTO } from './ping.dto';

@ApiTags('ping')
@Controller('api/ping')
export class PingController {
  constructor(private readonly pingService: PingService) {}

  @Get('')
  async getAllPings() {
    return await this.pingService.getAllPings();
  }

  @Post('')
  async acceptPing(@Body() body: PingDTO) {
    try {
      await this.pingService.acceptPing(body);
      return { status: 'success' };
    } catch (error) {
      throw new BadRequestException();
    }
  }
}

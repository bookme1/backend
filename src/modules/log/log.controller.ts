import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { LogsService } from './log.service';
import { SaveLogDto } from './log.dto';

@ApiTags('log')
@Controller('api/log')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('')
  public getAll() {
    return this.logsService.findAll();
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':id')
  public async getById(@Param('id') id: string) {
    try {
      return await this.logsService.findOne(id);
    } catch (error) {
      throw error.response;
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  public async createLog(@Body() log: SaveLogDto) {
    try {
      return await this.logsService.save(log);
    } catch (error) {
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Delete(':id')
  public removeLog(@Param('id') id: string) {
    return this.logsService.delete(id);
  }
}

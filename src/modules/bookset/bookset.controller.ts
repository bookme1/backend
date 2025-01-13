import { Controller, Get, Post, Body, Param, Delete, Patch } from '@nestjs/common';
import { BooksetService } from './bookset.service';
import { CreateBooksetDto } from './dto/create-bookset.dto';
import { ApiTags } from '@nestjs/swagger';
import { UpdateBooksetDto } from './dto/update-bookset.dto';

@ApiTags('bookset')
@Controller('api/bookset')
export class BooksetController {
  constructor(private readonly booksetService: BooksetService) {}

  @Post()
  async create(@Body() createBooksetDto: CreateBooksetDto) {
    return await this.booksetService.createBookSet(createBooksetDto);
  }

  @Get()
  async findAll() {
    return await this.booksetService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return await this.booksetService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() updateBooksetDto: UpdateBooksetDto) {
    return this.booksetService.updateBookSet(id, updateBooksetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.booksetService.remove(id);
  }
}

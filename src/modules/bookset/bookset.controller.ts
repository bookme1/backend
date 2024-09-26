import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { BooksetService } from './bookset.service';
import { CreateBooksetDto } from './dto/create-bookset.dto';
import { UpdateBooksetDto } from './dto/update-bookset.dto';

@Controller('bookset')
export class BooksetController {
  constructor(private readonly booksetService: BooksetService) {}

  @Post()
  create(@Body() createBooksetDto: CreateBooksetDto) {
    return this.booksetService.create(createBooksetDto);
  }

  @Get()
  findAll() {
    return this.booksetService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.booksetService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateBooksetDto: UpdateBooksetDto) {
    return this.booksetService.update(+id, updateBooksetDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.booksetService.remove(+id);
  }
}

import {
  Body,
  Controller,
  Get,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BooksService } from './book.service';

@ApiTags('book')
@Controller('api/book')
export class BooksController {
  constructor(private readonly bookService: BooksService) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('/')
  public getAll() {
    return this.bookService.findAll();
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/')
  public createUser(@Body() payload) {
    return this.bookService.saveBook(payload);
  }
}

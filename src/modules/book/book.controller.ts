import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BooksService } from './book.service';
import { EditBookDto, FindBookDto, SaveBookDto } from './book.dto';

@ApiTags('book')
@Controller('api/book')
export class BooksController {
  constructor(private readonly bookService: BooksService) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('')
  public getAll(@Query() params: FindBookDto) {
    if (!params) {
      return this.bookService.findAll();
    } else {
      return this.bookService.findByParam(params.type, params.value);
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get(':id')
  public async getById(@Param('id') id: string) {
    try {
      return await this.bookService.findOne(id);
    } catch (error) {
      throw error.response;
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post()
  public async createBook(@Body() bookSaveDto: SaveBookDto) {
    try {
      return await this.bookService.saveBook(bookSaveDto);
    } catch (error) {
      if (
        // Check error if title unique
        error.code === '23505' &&
        error.constraint.includes('UQ_c10a44a29ef231062f22b1b7ac5')
      ) {
        throw new HttpException('Title must be unique', HttpStatus.BAD_REQUEST);
      }

      // Other errors
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Patch(':id')
  public async editBook(
    @Body() bookEditDto: EditBookDto,
    @Param('id') id: string,
  ) {
    try {
      return await this.bookService.editBook(bookEditDto, id);
    } catch (error) {
      if (
        // Check error if title unique
        error.code === '23505' &&
        error.constraint.includes('UQ_c10a44a29ef231062f22b1b7ac5')
      ) {
        throw new HttpException('Title must be unique', HttpStatus.BAD_REQUEST);
      }

      // Other errors
      throw new HttpException(
        'Internal server error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Delete(':id')
  public removeBook(@Param('id') id: string) {
    return this.bookService.remove(id);
  }
}

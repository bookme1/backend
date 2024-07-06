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
import {
  EditBookDto,
  FilterBookDto,
  FindBookDto,
  SaveBookDto,
} from './book.dto';

@ApiTags('book')
@Controller('api/book')
export class BooksController {
  constructor(private readonly bookService: BooksService) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('')
  public getAll(@Query() params: FindBookDto) {
    if (params.type === undefined && params.value === undefined) {
      return this.bookService.findAll();
    } else {
      return this.bookService.findByParam(params.type, params.value);
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('/filter')
  public getFiltered(@Query() booksFilterDto: FilterBookDto) {
    return this.bookService.filterItems(booksFilterDto);
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
  @Post('/updateBooksFromServer')
  public async updateBoooksFromArthouse() {
    try {
      const response = await this.bookService.updateBooksFromArthouse();
      console.log('Response:', response);
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  @Post('/watermarking')
  public async makeWatermark() {
    try {
      const response = await this.bookService.watermarking();
      return response;
    } catch (error) {
      throw error;
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

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/checkout')
  public async makeCheckout(@Query('amount') amount: number) {
    try {
      const response = await this.bookService.testCheckout(amount);
      console.log('Response:', response);
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }
}

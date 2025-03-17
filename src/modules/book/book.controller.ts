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
  UseGuards,
  UsePipes,
  ValidationPipe,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { BooksService } from './book.service';
import {
  CartWatermarkDTO,
  deliverDTO,
  EditBookDto,
  FilterBookDto,
  SaveBookDto,
  WatermarkDTO,
} from './book.dto';
import { constants } from 'src/config/constants';
import { Book } from 'src/db/Book';
import { Repository } from 'typeorm';
import { OnixService } from '../onix/onix.service';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthGuard } from '../auth/strategies/accessToken.strategy';

@ApiTags('book')
@Controller('api/book')
export class BooksController {
  constructor(
    private readonly bookService: BooksService,
    private readonly onixService: OnixService,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('')
  public getAll() {
    return this.bookService.findAll();
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Get('/filter')
  public getFiltered(@Query() booksFilterDto: FilterBookDto) {
    return this.bookService.filterItems(booksFilterDto);
  }

  @Get('update-from-arthouse')
  async updateBooksFromArthouse() {
    let totalUpdated = 0;

    try {
      // Инициализация переменных для чанков
      const chunkSize = 30;
      let hasMoreData = true;

      while (hasMoreData) {
        // 1. Получаем данные текущего чанка
        const products = await this.onixService.makeDigestRequest(
          'platform.elibri.com.ua', // host
          '/api/v1/queues/meta/pop', // path
          'POST', // method
          'bookme', // username
          '64db6ffd98a76c2b879c', // password
          { count: chunkSize }, // postData
          false, // useHttps = false
        );

        if (!products || products.length === 0) {
          hasMoreData = false; // Если нет данных, выходим из цикла
          // this.logger.log('No more products to update.');
          break;
        }

        // this.logger.log(`Processing chunk of ${products.length} products...`);

        // 2. Обновление книг из текущего чанка
        const updatedBooks = await Promise.all(
          products.map(async (product) => {
            const finalBookData =
              await this.onixService.parseOnixProduct(product);
            return this.upsertBook(finalBookData);
          }),
        );

        totalUpdated += updatedBooks.length;
      }

      // this.logger.log(`Successfully updated a total of ${totalUpdated} books.`);
      return {
        status: 201,
        message: 'All chunks updated successfully',
        updated: totalUpdated,
      };
    } catch (error) {
      // this.logger.error('Error updating books from Arthouse:', error.stack);
      return {
        status: 500,
        message: 'Update failed',
        error: error.message,
      };
    }
  }

  // Сохранение или обновление книги
  private async upsertBook(finalBookData: any) {
    const existingBook = await this.bookRepository.findOne({
      where: { referenceNumber: finalBookData.referenceNumber },
    });

    if (existingBook) {
      // Обновление существующей книги
      const updatedBook = {
        ...existingBook,
        ...finalBookData,
        header: {
          ...existingBook.header,
          originalModifiedAt: new Date().toISOString(),
        },
      };
      await this.bookRepository.save(updatedBook);
      return updatedBook;
    } else {
      // Создание новой книги
      const newBook = this.bookRepository.create({
        ...finalBookData,
        header: {
          createdAt: new Date().toISOString(),
          originalModifiedAt: new Date().toISOString(),
          modifiedAt: '',
          modifiedBy: 0,
        },
      });
      await this.bookRepository.save(newBook);
      return newBook;
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
  @Post('/updateBooksFromServer')
  public async updateBoooksFromArthouse() {
    try {
      const response = await this.bookService.updateBooksFromArthouse();
      console.log('Response:', response);
      return response;
    } catch (error) {
      console.error('Error:', error);
      return error;
    }
  }

  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/refillQueue')
  public async refillQueue() {
    try {
      const response = await this.bookService.refillItemsQueue();
      console.log('Response:', response);
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  //Make it private!!! only for registered users
  @Post('/watermarking')
  public async makeWatermark(
    @Body()
    body: WatermarkDTO,
  ) {
    try {
      const response = await this.bookService.watermarking(
        body.formats,
        body.reference_number,
        body.order_id,
      );
      return response;
    } catch (error) {
      throw error;
    }
  }

  //Make it private!!! only for registered users
  @Post('/cart-watermarking')
  public async makeCartWatermark(
    @Body()
    body: CartWatermarkDTO,
  ) {
    try {
      const response = await this.bookService.cartWatermarking(body.order_id);
      return response;
    } catch (error) {
      throw error;
    }
  }

  @Post('/deliver')
  public async makeDeliver(@Body() transactionId: deliverDTO) {
    try {
      const response = await this.bookService.deliver(
        transactionId.transactionId,
      );
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
  public async makeCheckout(
    @Query('amount') amount: number,
    @Query('order_id') order_id: string,
    @Query('description') description: string,
  ) {
    try {
      const response = await this.bookService.testCheckout(
        amount,
        order_id,
        description,
      );
      console.log('Response:', response);
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth(constants.authPatternName)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/cart-checkout')
  public async makeCartCheckout(@Request() req: any) {
    try {
      const response = await this.bookService.checkout(req.user.userId);
      console.log('Response:', response);
      return response;
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  @Get('payment-status/:order_id')
  async getPaymentStatus(@Param('order_id') order_id: string) {
    try {
      const paymentStatus = await this.bookService.checkPaymentStatus(order_id);
      return { status: paymentStatus.status }; // Вернуть статус платежа или другие данные
    } catch (error) {
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }
}

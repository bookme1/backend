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
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { constants } from 'src/config/constants';
import { Book } from 'src/db/Book';
import { Repository } from 'typeorm';
import { OnixService } from '../onix/onix.service';
import { InjectRepository } from '@nestjs/typeorm';

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

  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @UsePipes(new ValidationPipe({ transform: true }))
  @Post('/cart-checkout')
  public async makeCartCheckout(@Request() req: any) {
    try {
      const response = await this.bookService.checkout(req.user.id);
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

  @Get('update-from-arthouse')
  async updateBooksFromArthouse() {
    try {
      // // 1. Получаем массив Product
      // const products = await this.onixService.makeDigestRequest(
      //   'platform.elibri.com.ua', // host
      //   '/api/v1/queues/meta/pop', // path
      //   'POST', // method
      //   'bookme', // username
      //   '64db6ffd98a76c2b879c', // password
      //   { count: 30 }, // postData
      //   false, // useHttps = false (если нужно HTTPS, поставьте true)
      // );

      // if (!products || products.length === 0) {
      //   return {
      //     status: 204,
      //     message: 'No products to update',
      //     updated: 0,
      //   };
      // }

      // let updatedCount = 0;

      // // 2. Парсим каждый продукт и сохраняем/обновляем
      // for (const product of products) {
      //   const finalBookData = this.bookService.parseOnixProduct(product);

      //   // Проверяем наличие книги в БД
      //   const existingBook = await this.bookRepository.findOne({
      //     where: { referenceNumber: finalBookData.referenceNumber },
      //   });

      //   if (existingBook) {
      //     // Обновление
      //     const oldOriginal = existingBook.original;
      //     existingBook.original = finalBookData;

      //     // Если какое-то поле совпадало со старым original — обновляем
      //     Object.keys(finalBookData).forEach((key) => {
      //       if (existingBook[key] === oldOriginal[key]) {
      //         existingBook[key] = finalBookData[key];
      //       }
      //     });

      //     existingBook.header.originalModifiedAt = new Date().toISOString();

      //     await this.bookRepository.save(existingBook);
      //   } else {
      //     // Создание
      //     const newBook = this.bookRepository.create({
      //       ...finalBookData,
      //       original: finalBookData,
      //       header: {
      //         createdAt: new Date().toISOString(),
      //         originalModifiedAt: new Date().toISOString(),
      //         modifiedAt: '',
      //         modifiedBy: 0,
      //       },
      //     });
      //     await this.bookRepository.save(newBook);
      //   }

      //   updatedCount++;
      // }

      return {
        status: 201,
        message: 'Chunk update succeed',
        // updated: updatedCount,
      };
    } catch (error) {
      return {
        status: 409,
        message: 'Chunk update failed',
        error: error.message,
      };
    }
  }
}

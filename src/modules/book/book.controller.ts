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

@ApiTags('book')
@Controller('api/book')
export class BooksController {
  constructor(private readonly bookService: BooksService) {}

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
}

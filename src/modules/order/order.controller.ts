import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDTO } from './order.dto';
import { AccessTokenGuard } from 'src/common/guards/accessToken.guard';
import { constants } from 'src/config/constants';
import { BooksService } from '../book/book.service';

@ApiTags('order')
@Controller('api/order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    private readonly bookService: BooksService,
  ) {}

  //ONLY ADMINS
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Get('/getAll')
  public getAllOrders() {
    return this.orderService.getAllOrders();
  }

  // ONLY REGISTERED USERS
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Post('/')
  public createOrder(@Body() order: CreateOrderDTO, @Request() req: any) {
    const { id: userId } = req.user;
    return this.orderService.createOrder(order, userId);
  }

  // ONLY REGISTERED USERS
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Get('/orderedBooks')
  public async getUserBoughtBooks(@Request() req: any) {
    const { id: userId } = req.user;
    // Check status for all loading payments. If payed -> deliver
    const ordersInLoading = await this.orderService.findAllLoading(userId);
    ordersInLoading.forEach((o) => {
      this.bookService.checkPaymentStatus(o.order_id);
    });

    //Check all delievered whether they are succeed
    const ordersPartiallySucceed =
      await this.orderService.findAllDelievered(userId);
    ordersPartiallySucceed.forEach((o) => {
      this.orderService.checkDeliveryOrder(o.order_id);
    });

    // Take all books from succeed orders
    const succeedOrders = await this.orderService.findAllSucceed(userId);
    return succeedOrders.flatMap((o) => o.orderBooks);
  }
}

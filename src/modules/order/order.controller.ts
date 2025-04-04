import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OrderService } from './order.service';
import { CreateOrderDTO } from './order.dto';
import { constants } from 'src/config/constants';
import { BooksService } from '../book/book.service';
import { AuthGuard } from '../auth/strategies/accessToken.strategy';

@ApiTags('order')
@Controller('api/order')
export class OrderController {
  constructor(
    private readonly orderService: OrderService,
    @Inject(forwardRef(() => BooksService))
    private readonly bookService: BooksService,
  ) {}

  //ONLY ADMINS
  @UseGuards(AuthGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Get('/getAll')
  public getAllOrders() {
    return this.orderService.getAllOrders();
  }

  // ONLY REGISTERED USERS
  @UseGuards(AuthGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Post('/')
  public async createOrder(@Body() dto: CreateOrderDTO, @Request() req: any) {
    const { userId } = req.user;
    const order = await this.orderService.createOrder(
      dto.books,
      dto.order_id,
      userId,
    );
    return await this.bookService.cartWatermarking(order.order_id);
  }

  // ONLY REGISTERED USERS
  @UseGuards(AuthGuard)
  @ApiBearerAuth(constants.authPatternName)
  @Get('/orderedBooks')
  public async getUserBoughtBooks(@Request() req: any) {
    const { userId } = req.user;
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

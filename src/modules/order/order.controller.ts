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

@ApiTags('order')
@Controller('api/order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

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
}

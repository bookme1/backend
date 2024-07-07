import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/db/Order';
import { CreateOrderDTO, Status } from './order.dto';
import { User } from 'src/db/User';
import { OrderBook } from 'src/db/OrderBook';
import { Book } from 'src/db/Book';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private repository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
  ) {}

  async getAllOrders() {
    return await this.repository.find();
  }

  async createOrder(
    createOrderDTO: CreateOrderDTO,
    userId: string,
  ): Promise<any> {
    if (
      !createOrderDTO.orderBooks ||
      !createOrderDTO.order_id ||
      !createOrderDTO.amount
    ) {
      throw new BadRequestException('Not all parameters in order');
    }

    const user = await this.userRepository.findOne({
      where: { id: Number(userId) },
      relations: ['orders'], // Ensure user orders are loaded
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const order = new Order();
    order.order_id = createOrderDTO.order_id;
    order.status = Status.Loading;
    order.amount = createOrderDTO.amount;
    order.user = user;
    order.orderBooks = [];

    for (const book of createOrderDTO.orderBooks) {
      const orderBook = new OrderBook();
      orderBook.orderedFormats = book.ordered_formats;
      orderBook.book = await this.booksRepository.findOne({
        where: { referenceNumber: book.reference_number },
      });
      orderBook.transId = book.transaction_id;
      orderBook.order = order; // Make relations with order
      order.orderBooks.push(orderBook); // Add orderBook to the array
    }

    const savedOrder = await this.repository.save(order);

    // Returning a plain object to avoid circular references
    return {
      order_id: savedOrder.order_id,
      status: savedOrder.status,
      amount: savedOrder.amount,
      user: savedOrder.user.id,
      orderBooks: savedOrder.orderBooks.map((orderBook) => ({
        orderedFormats: orderBook.orderedFormats,
        transId: orderBook.transId,
        book: {
          referenceNumber: orderBook.book.referenceNumber,
        },
      })),
    };
  }
}

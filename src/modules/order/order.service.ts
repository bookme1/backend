import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from 'src/db/Order';
import { CreateOrderDTO } from './order.dto';
import { User } from 'src/db/User';
import { OrderBook } from 'src/db/OrderBook';
import { Book } from 'src/db/Book';
import { Status } from 'src/db/types';
import { Ping } from 'src/db/Ping';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private repository: Repository<Order>,
    @InjectRepository(OrderBook)
    private orderBookrepository: Repository<OrderBook>,
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
    userId: number,
  ): Promise<any> {
    let ifSomethingEmpty = false;

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
      if (
        book.ordered_formats == null ||
        book.reference_number == null ||
        book.transaction_id == null
      ) {
        ifSomethingEmpty = true;
      }
      const orderBook = new OrderBook();
      orderBook.orderedFormats = book.ordered_formats;
      orderBook.book = await this.booksRepository.findOne({
        where: { referenceNumber: book.reference_number },
      });
      orderBook.transId = book.transaction_id;
      orderBook.order = order; // Make relations with order
      order.orderBooks.push(orderBook); // Add orderBook to the array
    }

    if (ifSomethingEmpty) order.status = Status.Error;

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

  async findAllLoading(userId: number): Promise<Order[]> {
    return await this.repository.find({
      where: { user: { id: userId }, status: Status.Loading },
    });
  }

  async findAllDelievered(userId: number): Promise<Order[]> {
    return await this.repository.find({
      where: { user: { id: userId }, status: Status.Delievered },
    });
  }

  async findAllSucceed(userId: number): Promise<Order[]> {
    return await this.repository.find({
      where: { user: { id: userId }, status: Status.Succeed },
    });
  }

  async orderDelievered(ping: Ping) {
    //Find ordered book by transaction id from ping
    const orderBook = await this.orderBookrepository.findOne({
      where: { transId: ping.transactionId },
    });
    if (!orderBook) {
      return new BadRequestException('Order book not found by transaction id');
    }
    // Assign link values to books from elibri ping
    orderBook.epubLink = ping.epubLink;
    orderBook.pdfLink = ping.pdfLink;
    orderBook.mobiLink = ping.mobiLink;
    orderBook.status = Status.Succeed;

    await this.orderBookrepository.save(orderBook);

    // Check if all books were already delievered from order
    await this.checkDeliveryOrder(orderBook.orderId);

    return 'Succeed';
  }

  async checkDeliveryOrder(orderId: string) {
    const order = await this.repository.findOne({
      where: { order_id: orderId },
    });

    if (!order) return new BadRequestException("order wasn't found");

    const shouldStatusChange = order.orderBooks.findIndex(
      (o) => o.status != Status.Succeed,
    );

    if (shouldStatusChange == -1) {
      order.status = Status.Succeed;
      this.repository.save(order);
      return true;
    }

    return false;
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Order } from 'src/db/Order';
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
    bookIds: string[],
    orderId: string,
    userId: number,
  ): Promise<Order> {
    if (!bookIds.length) {
      throw new BadRequestException('No books to create an order');
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const order = new Order();
    order.order_id = orderId;
    order.status = Status.Loading;
    order.user = user;
    order.orderBooks = [];

    let amount = 0;

    for (const bookId of bookIds) {
      const book = await this.booksRepository.findOne({
        where: { id: bookId },
      });

      if (!book) {
        throw new ConflictException(`Book not found by id: ${bookId}`);
      }

      const orderedFormats: string[] = [];
      if (book.formatEpub) orderedFormats.push('epub');
      if (book.formatMobi) orderedFormats.push('mobi');
      if (book.formatPdf) orderedFormats.push('pdf');

      const orderBook = new OrderBook();
      orderBook.book = book;
      orderBook.orderedFormats = orderedFormats.join(',');
      orderBook.order = order;
      orderBook.status = Status.Created;

      order.orderBooks.push(orderBook);
      amount += book.price;
    }

    order.amount = amount;
    const savedOrder = await this.repository.save(order);

    return savedOrder;
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
      where: {
        user: { id: userId },
        status: In([Status.Succeed, Status.Payed]),
      },
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

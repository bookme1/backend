import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, In } from 'typeorm';
import { Book } from 'src/db/Book';
import { FilterBookDto } from './book.dto';
import { request } from 'https';
import { createHash, createHmac, randomBytes, randomUUID } from 'crypto';
import * as convert from 'xml-js';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as qs from 'qs';
import { Order } from 'src/db/Order';
import { Status } from 'src/db/types';
import { User } from 'src/db/User';
import { OrderBook } from 'src/db/OrderBook';
import { readText, toArray } from './helper';
import { LogsService } from '../log/log.service';
import { BookExtractor } from './lib/onixExtractor';
import { OrderService } from '../order/order.service';
import { getConfig } from 'src/config';

const config = getConfig();

const elibri_public_key = config.ELIBRI_PUBLIC_KEY;
const elibri_private_key = config.ELIBRI_PRIVATE_KEY;

@Injectable()
export class BooksService {
  constructor(
    private logsService: LogsService,
    @Inject(forwardRef(() => OrderService))
    private readonly orderService: OrderService,
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    private httpService: HttpService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(OrderBook)
    private orderBookRepository: Repository<OrderBook>,
  ) {}

  findAll(): Promise<Book[]> {
    return this.booksRepository.find();
  }

  async findBooksByIds(bookIds: string[]): Promise<Book[]> {
    return this.booksRepository.find({
      where: { id: In(bookIds) },
    });
  }

  async findOne(id: string) {
    const book = await this.booksRepository.findOne({
      where: { id },
      select: [
        'id',
        'art',
        'title',
        'url',
        'price',
        'pages',
        'lang',
        'desc',
        'author',
        'pub',
        'genre',
        'formatEpub',
        'formatMobi',
        'formatPdf',
        'referenceNumber',
      ],
    });
    if (!book) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }
    return book;
  }

  async findByParam(type: string, value: string) {
    const books = await this.booksRepository.find({
      where: { [type]: ILike(`%${value}%`) },
    });
    if (!books) {
      throw new NotFoundException(`Book with ${type}: ${value} not found`);
    }
    return books;
  }

  parseAuthenticateHeader(header) {
    const parts = header.split(',');
    const values = {};
    parts.forEach((part) => {
      const match = /(\w+)="([^"]+)"/.exec(part.trim());
      if (match) {
        values[match[1]] = match[2];
      }
    });
    return values;
  }

  createDigestHeader(authValues, method, uri, username, password) {
    const ha1 = createHash('md5')
      .update(`${username}:${authValues.realm}:${password}`)
      .digest('hex');
    const ha2 = createHash('md5').update(`${method}:${uri}`).digest('hex');
    const nc = '00000001';
    const cnonce = randomBytes(16).toString('hex');
    const response = createHash('md5')
      .update(
        `${ha1}:${authValues.nonce}:${nc}:${cnonce}:${authValues.qop}:${ha2}`,
      )
      .digest('hex');

    return `Digest username="${username}", realm="${authValues.realm}", nonce="${authValues.nonce}", uri="${uri}", response="${response}", qop=${authValues.qop}, nc=${nc}, cnonce="${cnonce}", opaque="${authValues.opaque}"`;
  }

  async makeDigestRequest(
    host: string,
    path: string,
    method: string,
    username: string,
    password: string,
    postData?: object,
  ) {
    return new Promise((resolve, reject) => {
      const initialOptions = {
        host: host,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = request(initialOptions, (res) => {
        if (res.statusCode === 401) {
          const wwwAuthenticate = res.headers['www-authenticate'];
          const authValues = this.parseAuthenticateHeader(wwwAuthenticate);

          const digestHeader = this.createDigestHeader(
            authValues,
            method,
            path,
            username,
            password,
          );

          const authOptions = {
            host: host,
            path: path,
            method: method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: digestHeader,
            },
          };

          const authReq = request(authOptions, (res) => {
            let body = '';
            res.on('data', (d) => {
              body += d;
            });
            res.on('end', async () => {
              try {
                // console.log('Raw response body:', body); // Логируем тело ответа
                const jsonResult = await convert.xml2json(body, {
                  compact: true,
                  spaces: 2,
                });

                // console.log('Parsed response:', jsonResult);

                if (!jsonResult || jsonResult.trim() === '') {
                  // Если ответ пустой, возвращаем пустой массив
                  resolve([]);
                }

                const parsedResult = JSON.parse(jsonResult);

                // Проверяем наличие Product, если его нет, возвращаем пустой массив
                if (parsedResult?.ONIXMessage?.Product) {
                  resolve(parsedResult.ONIXMessage.Product);
                } else {
                  console.log(
                    'ONIXMessage.Product не найдено, возвращаем пустой массив.',
                  );
                  resolve([]); // Возвращаем пустой массив, если Product не найден
                }
              } catch (error) {
                reject(error);
              }
            });
          });

          if (postData) {
            // Логируем данные, которые отправляются на сервер
            console.log('Отправка данных:', postData);
            authReq.write(JSON.stringify(postData));
          }

          authReq.end();
        } else if (res.statusCode >= 200 && res.statusCode < 300) {
          let body = '';
          res.on('data', (d) => {
            body += d;
          });
          res.on('end', async () => {
            try {
              const jsonResult = await convert.xml2json(body, {
                compact: true,
                spaces: 2,
              });

              console.log('Parsed response:', jsonResult);

              if (!jsonResult || jsonResult.trim() === '') {
                throw new Error('Пустой ответ от сервера');
              }

              const parsedResult = JSON.parse(jsonResult);

              if (parsedResult?.ONIXMessage?.Product) {
                resolve(parsedResult.ONIXMessage.Product);
              } else {
                console.error(
                  'ONIXMessage.Product не найдено в ответе:',
                  parsedResult,
                );
                reject(new Error('ONIXMessage.Product не найдено'));
              }
            } catch (error) {
              console.error('Ошибка при парсинге ответа:', error);
              reject(error);
            }
          });
        } else {
          reject(new Error(`Unexpected status code: ${res.statusCode}`));
        }
      });

      req.on('error', (error) => {
        console.error('Ошибка запроса:', error);
        reject(error);
      });

      req.end();
    });
  }

  async makeDigestRequestWitouthData(host, path, method, username, password) {
    return new Promise((resolve, reject) => {
      const initialOptions = {
        host: host,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = request(initialOptions, (res) => {
        if (res.statusCode === 401) {
          const wwwAuthenticate = res.headers['www-authenticate'];
          const authValues = this.parseAuthenticateHeader(wwwAuthenticate);

          const digestHeader = this.createDigestHeader(
            authValues,
            method,
            path,
            username,
            password,
          );

          const authOptions = {
            host: host,
            path: path,
            method: method,
            headers: {
              'Content-Type': 'application/json',
              Authorization: digestHeader,
            },
          };

          const authReq = request(authOptions, (res) => {
            let body = '';
            res.on('data', (d) => {
              body += d;
            });
            res.on('end', async () => {
              try {
                const jsonResult = await convert.xml2json(body, {
                  compact: true,
                  spaces: 2,
                });
                resolve(JSON.parse(jsonResult));
              } catch (error) {
                reject(error);
              }
            });
          });

          authReq.end();
        } else {
          reject(new Error(`Unexpected status code: ${res.statusCode}`));
        }
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.end();
    });
  }

  async watermarking(
    formats: string,
    reference_number: string,
    order_id: string,
  ): Promise<string> {
    if (!formats || !reference_number || !order_id) {
      throw new BadRequestException('Not all parameters in order');
    }

    const now = new Date();
    // UNIX timestamp
    const unixTimestamp = Math.floor(now.getTime() / 1000).toString();

    // Generate HMAC for creating signature (sig)
    const hmac = createHmac('sha1', unixTimestamp);
    const hmacDigest = hmac.update(elibri_private_key).digest('base64');
    const sig = encodeURIComponent(hmacDigest);
    const data = {
      record_reference: reference_number,
      formats: formats,
      visible_watermark: `Цю книгу купив користувач: user@domain.com (Замовлення № ${order_id}, b3258, 2024-07-06 21:55:25)`,
      stamp: unixTimestamp,
      sig: sig, // Динамический HMAC в виде подписи
      token: elibri_public_key,
    };

    try {
      const fetchModule = await import('node-fetch');
      const fetch = fetchModule.default;
      const url = 'https://platform.elibri.com.ua/watermarking/watermark';
      const response = await fetch(url, {
        method: 'POST',
        body: new URLSearchParams(data as Record<string, string>),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Получаем текстовое представление ответа, transaction_id
      const textResponse = await response.text();
      console.log('Текстовый ответ от сервера:', textResponse);
      return textResponse;
    } catch (error) {
      console.error('Ошибка при отправке запроса1:', error.message);

      throw new InternalServerErrorException({
        message: 'Watermarking was not successful',
        cause: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async cartWatermarking(order_id: string): Promise<string[]> {
    if (!order_id) {
      throw new BadRequestException('Order id is not provided');
    }

    const order = await this.orderRepository.findOne({
      where: { order_id },
      relations: ['orderBooks', 'orderBooks.book', 'user'], // Load relations
    });

    if (!order) {
      await this.logsService.save({
        source: 'Error by cart watermarking',
        message: 'Order not found by the id: ' + order_id,
        code: 9002,
      });
      throw new BadRequestException('Order not found by that id');
    }

    const fetchModule = await import('node-fetch');
    const fetch = fetchModule.default;

    const updatedOrder = order;

    const transactionIds: string[] = [];

    for (const [index, orderBook] of order.orderBooks.entries()) {
      const now = new Date();
      const unixTimestamp = Math.floor(now.getTime() / 1000).toString();

      // HMAC generation for signature
      const hmac = createHmac('sha1', unixTimestamp);
      const hmacDigest = hmac.update(elibri_private_key).digest('base64');
      const sig = encodeURIComponent(hmacDigest);

      const data = {
        record_reference: orderBook.book.referenceNumber,
        formats: orderBook.orderedFormats,
        visible_watermark: `Цю книгу купив користувач: ${order.user.username} (Замовлення № ${order_id}, ${now.toISOString()})`,
        stamp: unixTimestamp,
        sig: sig,
        token: elibri_public_key,
      };

      try {
        const url = 'https://platform.elibri.com.ua/watermarking/watermark';
        const response = await fetch(url, {
          method: 'POST',
          body: new URLSearchParams(data as Record<string, string>),
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const transactionId = await response.text();

        if (!transactionId) throw new ConflictException();

        // Set transaction id in OrderBook
        orderBook.transId = transactionId;
        updatedOrder.orderBooks[index] = orderBook;
        transactionIds.push(transactionId);
      } catch (error) {
        await this.logsService.save({
          source: 'Error by watermarking the ordered book: ' + orderBook.id,
          message: error,
          context: order,
          code: 9003,
        });
        throw error;
      }
    }

    // Update transaction id for each book in DB
    updatedOrder.orderBooks.map(async (orderBook) => {
      await this.orderBookRepository.update(orderBook.id, orderBook);
    });

    return transactionIds; // Return transaction_id[] for delivery
  }

  async deliver(orderId: string): Promise<string> {
    const order = await this.orderRepository.findOne({
      where: { order_id: orderId },
      relations: ['orderBooks'],
    });

    if (!order) {
      await this.logsService.save({
        source: 'Delivery error',
        message: 'Order not found: ' + orderId,
        context: orderId,
        code: 9004,
      });
      throw new BadRequestException('Order not found');
    }

    if (order.status !== Status.Payed) {
      await this.logsService.save({
        source: 'Delivery error',
        message: 'Order not paid',
        context: order,
        code: 9004,
      });
      return "You didn't pay!";
    }

    const fetchModule = await import('node-fetch');
    const fetch = fetchModule.default;

    const deliveredTransactionIds: string[] = [];

    for (const orderBook of order.orderBooks) {
      if (!orderBook.transId) {
        await this.logsService.save({
          source: 'Delivery error',
          message: `No transactionId in orderBook id: ${orderBook.id}`,
          context: orderBook,
          code: 9006,
        });
        continue; // Skip without transaction id
      }

      const now = new Date();
      const unixTimestamp = Math.floor(now.getTime() / 1000).toString();

      const hmac = createHmac('sha1', unixTimestamp);
      const hmacDigest = hmac.update(elibri_private_key).digest('base64');
      const sig = encodeURIComponent(hmacDigest);

      const data = {
        trans_id: orderBook.transId,
        stamp: unixTimestamp,
        sig: sig,
        token: elibri_public_key,
      };

      try {
        const response = await fetch(
          'https://platform.elibri.com.ua/watermarking/deliver',
          {
            method: 'POST',
            body: new URLSearchParams(data as Record<string, string>),
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          },
        );

        if (!response.ok) {
          const body = await response.text();
          await this.logsService.save({
            source: 'Delivery error',
            message: `Elibri could not deliver book: ${orderBook.id}`,
            context: response,
            code: 9007,
          });
          throw new Error(`HTTP ${response.status} - ${body}`);
        }

        await response.text();
        deliveredTransactionIds.push(orderBook.transId);
      } catch (error) {
        await this.logsService.save({
          source: 'Delivery error',
          message: `Failed to deliver book ID: ${orderBook.id}, transId: ${orderBook.transId}`,
          context: error,
          code: 9005,
        });

        // If at least 1 book was not delivered — do not mark as Delivered
        throw new InternalServerErrorException({
          message: 'Delivery failed for some books',
          cause: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // At that point, all books are successful delivered
    order.status = Status.Delievered;
    await this.orderRepository.save(order);

    return 'OK';
  }

  async updateBooksFromArthouse() {
    try {
      await this.logsService.save({
        source: 'updateBooksFromArthouse',
        message: 'Starting book update process from Arthouse...',
        code: 1000,
      });

      let dumpedBooks;
      let dumpedQuantity = 0;

      do {
        dumpedBooks = await this.makeDigestRequest(
          'platform.elibri.com.ua',
          '/api/v1/queues/meta/pop',
          'POST',
          'bookme',
          '64db6ffd98a76c2b879c',
          { count: 30 },
        );

        if (!dumpedBooks || !Array.isArray(dumpedBooks)) {
          await this.logsService.save({
            source: 'updateBooksFromArthouse',
            message: 'No books received or invalid response format',
            code: 1001,
          });
          return {
            status: 204,
            message: 'No books to update',
            updated: dumpedQuantity,
          };
        }

        for (let i = 0; i < dumpedBooks.length; i++) {
          try {
            const serviceBookObject = dumpedBooks[i];

            const extractor = new BookExtractor(this.logsService);
            const newBookData = await extractor.extractBookData(
              serviceBookObject,
              i,
            );

            if (!newBookData) continue;

            // Проверяем, есть ли книга в базе
            const existingBook = await this.booksRepository.findOneBy({
              referenceNumber: newBookData.referenceNumber,
            });

            if (existingBook) {
              const modifiedAt = new Date().toISOString();

              // Обновляем только изменённые поля
              const updatedBook = {
                ...newBookData,
                header: {
                  originalModifiedAt: modifiedAt,
                },
              };

              await this.booksRepository.save(updatedBook);
            } else {
              const newBook = this.booksRepository.create({
                ...newBookData,
                header: {
                  createdAt: new Date().toISOString(),
                  originalModifiedAt: new Date().toISOString(),
                },
              });

              await this.booksRepository.save(newBook);
              await this.logsService.save({
                source: 'updateBooksFromArthouse',
                message: `Created new book: ${newBook.title} (Ref: ${newBook.referenceNumber})`,
                code: 2001,
                context: dumpedBooks[i],
              });
            }

            dumpedQuantity += 1;
          } catch (bookError) {
            await this.logsService.save({
              source: 'updateBooksFromArthouse',
              message: `Error processing book index ${i}: ${bookError.message}`,
              code: 4001,
              context: JSON.stringify(dumpedBooks[i], null, 2),
            });
            dumpedQuantity += 1; // Maybe count it as errored
          }
        }
      } while (dumpedQuantity < 240 && dumpedBooks.length !== 0);

      this.logsService.save({
        source: 'updateBooksFromArthouse',
        message: `Finished processing books. Total updated: ${dumpedQuantity}`,
        code: 1003,
      });

      return {
        status: dumpedQuantity == 30 ? 201 : 204,
        message: 'Chunk update succeed',
        updated: dumpedQuantity,
      };
    } catch (error) {
      await this.logsService.save({
        source: 'updateBooksFromArthouse',
        message: `Critical error: ${error.message}`,
        context: JSON.stringify(error, null, 2),
        code: 5000,
      });

      return {
        status: 409,
        message: 'Chunk update failed',
        error,
      };
    }
  }

  async refillItemsQueue() {
    try {
      await this.makeDigestRequestWitouthData(
        'platform.elibri.com.ua',
        '/api/v1/queues/refill_all',
        'POST',
        'bookme',
        '64db6ffd98a76c2b879c',
      );
      return {
        status: 201,
        message: 'Refill queue succeed',
      };
    } catch (error) {
      return {
        status: 409,
        message: 'Refill queue failed',
        error,
      };
    }
  }

  async filterItems(params: FilterBookDto): Promise<{
    quantity: number;
    books: Partial<Pick<Book, 'referenceNumber' | 'title'>>[];
  }> {
    try {
      const queryBuilder = this.booksRepository.createQueryBuilder('book');

      // Если задан параметр q, фильтруем по названию
      if (params.q && params.q.trim() !== '') {
        queryBuilder.andWhere('book.title ILIKE :q', {
          q: `${params.q}%`, // Ищем книги, начинающиеся с q
        });
      }

      // Фильтрация по авторам
      if (params.authors && params.authors.length > 0) {
        const authorsConditions = params.authors.map(
          (author, index) => `book.author ILIKE :author_${index}`,
        );
        const authorsParams = Object.fromEntries(
          params.authors.map((author, index) => [
            `author_${index}`,
            `%${author}%`,
          ]),
        );

        // Добавляем условия авторов
        queryBuilder.andWhere(authorsConditions.join(' OR '), authorsParams);
      }

      // Фильтрация по другим параметрам
      if (params.publishers && params.publishers.length > 0) {
        queryBuilder.andWhere('book.pub IN (:...publishers)', {
          publishers: params.publishers,
        });
      }

      if (params.genre && params.genre.length > 0) {
        const genreConditions = params.genre.map(
          (genre, index) =>
            `split_part(book.genre, ' / ', 2) ILIKE :genre_${index}`,
        );
        const genreParams = Object.fromEntries(
          params.genre.map((genre, index) => [`genre_${index}`, `%${genre}%`]),
        );
        queryBuilder.andWhere(genreConditions.join(' OR '), genreParams);
      }

      if (params.languages && params.languages.length > 0) {
        queryBuilder.andWhere('book.lang IN (:...languages)', {
          languages: params.languages,
        });
      }

      if (params.minPrice != null && params.maxPrice != null) {
        queryBuilder.andWhere(
          'CAST(book.price AS FLOAT) BETWEEN :minPrice AND :maxPrice',
          {
            minPrice: params.minPrice,
            maxPrice: params.maxPrice,
          },
        );
      }

      // Получаем общее количество отфильтрованных книг
      const totalQuery = queryBuilder.clone();
      const quantity = await totalQuery.getCount();

      // Реализация пагинации
      const page = Number(params.page) || 1;
      const pageSize = 24;
      const offset = (page - 1) * pageSize;

      queryBuilder.skip(offset).take(pageSize);

      // Если selectedReferenceAndTitle true, выбираем только id и title
      if (params.selectReferenceAndTitle) {
        queryBuilder.select(['book.referenceNumber', 'book.title']);
      }

      // Получаем книги
      const books = await queryBuilder.getMany();

      return { quantity, books };
    } catch (error) {
      throw new Error(`Error filtering books: ${error.message}`);
    }
  }

  async saveBook(book): Promise<Book> {
    try {
      return this.booksRepository.save(book);
    } catch (error) {
      return error.message;
    }
  }

  async editBook(options, id): Promise<Book> {
    const book = await this.findOne(id);
    return await this.saveBook({ ...book, ...options });
  }

  async remove(id: string): Promise<void> {
    await this.booksRepository.delete(id);
  }

  generateSignature(
    params: any,
    order_id: string,
  ): {
    data: string;
    signature: string;
    order_id: string;
  } {
    const liqpay_private_key = config.LIQPAY_PRIVATE_KEY;
    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = createHash('sha1')
      .update(liqpay_private_key + data + liqpay_private_key)
      .digest('base64');
    return { data, signature, order_id };
  }

  testCheckout(
    amount: number,
    order_id: string,
    description: string,
  ): {
    data: string;
    signature: string;
  } {
    const liqpay_public_key = config.LIQPAY_PUBLIC_KEY;

    const params = {
      public_key: liqpay_public_key,
      version: '3',
      action: 'pay',
      amount: amount,
      currency: 'UAH',
      description: description + '      Ідентифікатор замовлення: ' + order_id,
      order_id: order_id,
      // sandbox: 1,
    };

    return this.generateSignature(params, order_id);
  }

  async checkout(userId: number): Promise<{
    data: string;
    signature: string;
    order_id: string;
  }> {
    const orderId = randomUUID();

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['cart'],
    });

    if (!user || !user.cart.length) throw new Error('User or cart not found');

    const bookIds = user.cart.map((b) => b.id);

    // TODO: Replace it with func in user service
    user.cart = [];
    await this.userRepository.save(user);

    const order = await this.orderService.createOrder(bookIds, orderId, userId);

    const liqpay_public_key = config.LIQPAY_PUBLIC_KEY;

    const description = `Оплата за книги в магазині Bookme, ФОП Науменко Михайло Вікторович. Ідентифікатор замовлення: ${orderId}`;
    const params = {
      public_key: liqpay_public_key,
      version: '3',
      action: 'pay',
      amount: order.amount,
      currency: 'UAH',
      description,
      order_id: orderId,
      // sandbox: 1,
    };

    try {
      await this.cartWatermarking(order.order_id);

      const result = await this.generateSignature(params, orderId);

      return result;
    } catch (e) {
      this.logsService.save({
        source: 'Error by creating order in cart',
        message: e,
        code: 9001,
      });
    }
  }

  public addFormats(BodyResource: any) {
    if (!BodyResource.length) {
      return this.renderFormat(BodyResource.ResourceFileLink);
    } else {
      let dateToReturn = {};
      for (let i = 0; i < BodyResource.length; i++) {
        const format = this.renderFormat(BodyResource[i].ResourceFileLink);
        dateToReturn = Object.assign(format, dateToReturn);
      }
      return dateToReturn;
    }
  }

  public renderFormat(value: any) {
    if (!value || !value._text) {
      return {};
    }
    const valueFormat = value._text.split('.').pop();
    if (valueFormat == 'mobi') {
      return { formatMobi: value._text };
    } else if (valueFormat == 'pdf') {
      return { formatPdf: value._text };
    } else if (valueFormat == 'epub') {
      return { formatEpub: value._text };
    } else {
      return { formatPdf: 'Невірний формат' };
    }
  }

  async checkPaymentStatus(order_id: string): Promise<any> {
    const liqpay_public_key = config.LIQPAY_PUBLIC_KEY;
    const liqpay_private_key = config.LIQPAY_PRIVATE_KEY;
    const API_URL = 'https://www.liqpay.ua/api/request';

    const json = {
      action: 'status',
      version: 3,
      public_key: liqpay_public_key,
      order_id: order_id,
    };

    // Кодирование данных в base64
    const data = Buffer.from(JSON.stringify(json)).toString('base64');

    const hash = createHash('sha1');

    const signature = hash
      .update(liqpay_private_key + data + liqpay_private_key)
      .digest('base64');

    // Использование qs для создания строки запроса
    const postData = qs.stringify({
      data: data,
      signature: signature,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.post(API_URL, postData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );

      const order = await this.orderRepository.findOne({
        where: { order_id },
      });

      if (order) {
        if (
          response.data.status == 'error' ||
          response.data.status == 'failure'
        ) {
          order.status = Status.Error;
        } else if (
          // response.data.status == 'sandbox' ||
          response.data.status == 'success'
        ) {
          order.status = Status.Payed;
        } else if (response.data.status == 'processing') {
          order.status = Status.Loading;
        } else {
          order.status = Status.Unknown;
        }

        this.orderRepository.save(order);
      }

      return response.data;
    } catch (error) {
      console.error(error);
      // if (error.response) {
      // Это ошибка ответа от API LiqPay
      // throw new BadRequestException(
      //   `LiqPay API error: ${error.response.data.err_description}`,
      // );
      // } else {
      // Это другая ошибка, например, ошибка сети
      // throw new Error(`Error checking payment status: ${error.message}`);
      // }
    }
  }

  public async parseOnixProduct(product: any) {
    // Считываем RecordReference
    const recordReference = readText(product?.RecordReference, '');

    // DescriptiveDetail
    const descDetail = product?.DescriptiveDetail;
    // title
    let title = 'Без назви';
    if (descDetail?.TitleDetail) {
      const titleDetArr = toArray(descDetail.TitleDetail);
      if (titleDetArr.length > 0) {
        const titleElemArr = toArray(titleDetArr[0].TitleElement);
        if (titleElemArr.length > 0) {
          title = readText(titleElemArr[0].TitleText, 'Без назви');
        }
      }
    }

    // pages
    let pages = 0;
    if (descDetail?.Extent) {
      const extentArr = toArray(descDetail.Extent);
      if (extentArr.length > 0) {
        pages = Number(readText(extentArr[0].ExtentValue, '0'));
      }
    }

    // author
    const authors: string[] = [];
    if (descDetail?.NoContributor) {
      authors.push('Без автора');
    } else if (descDetail?.Contributor) {
      const contribArr = toArray(descDetail.Contributor);
      for (const c of contribArr) {
        const name = readText(c?.PersonName, '');
        if (name) authors.push(name);
      }
    }
    if (authors.length === 0) authors.push('Без автора');
    const author = authors.join(', ');

    // collateralDetail => desc, url
    let desc = 'Без опису';
    let url = '';
    console.warn('S RESOURCES: ', product);
    if (product?.CollateralDetail) {
      const textContents = toArray(product.CollateralDetail.TextContent);
      if (textContents.length > 0) {
        desc = readText(textContents[0]?.Text, 'Без опису');
      }
      // cover
      const sResources = toArray(product.CollateralDetail.SupportingResource);
      if (sResources.length > 0) {
        const resourceVerArr = toArray(sResources[0]?.ResourceVersion);
        if (resourceVerArr.length > 0) {
          url = readText(resourceVerArr[0]?.ResourceLink, '');
        }
      }
    }

    // price
    let price = 0;
    if (product?.ProductSupply?.SupplyDetail?.Price?.PriceAmount) {
      price = Number(
        readText(product.ProductSupply.SupplyDetail.Price.PriceAmount, '0'),
      );
    }

    // lang
    let lang = 'Немає інформації';
    if (descDetail?.Language) {
      const langArr = toArray(descDetail.Language);
      if (langArr.length > 0) {
        lang = readText(langArr[0]?.LanguageCode, 'Немає інформації');
      }
    }

    // publisher + pubDate
    let pub = 'Автор невідомий';
    let pubDate = 'Немає інформації';
    if (product?.PublishingDetail) {
      pub = readText(
        product.PublishingDetail?.Publisher?.PublisherName,
        'Автор невідомий',
      );
      const pDates = toArray(product.PublishingDetail?.PublishingDate);
      if (pDates.length > 0) {
        pubDate = readText(pDates[0]?.Date, 'Немає інформації');
      }
    }

    // genre
    let genre = 'Жанр невідомий';
    if (descDetail?.Subject) {
      const subjArr = toArray(descDetail.Subject);
      if (subjArr.length > 0) {
        genre = readText(subjArr[0]?.SubjectHeadingText, 'Жанр невідомий');
      }
    }

    return {
      referenceNumber: recordReference,
      art: '',
      title,
      url,
      price,
      pages,
      lang,
      desc,
      author,
      pub,
      pubDate,
      genre,
      formatMobi: '',
      formatPdf: '',
      formatEpub: '',
    };
  }
}

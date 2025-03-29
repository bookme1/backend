import {
  BadRequestException,
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

@Injectable()
export class BooksService {
  constructor(
    private logsService: LogsService,
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
    const secret = '1b41d378b24738917d314dff5c816b61'; // Private key
    const hmac = createHmac('sha1', unixTimestamp);
    const hmacDigest = hmac.update(secret).digest('base64');
    const sig = encodeURIComponent(hmacDigest);
    const data = {
      record_reference: reference_number,
      formats: formats,
      visible_watermark: `Цю книгу купив користувач: user@domain.com (Замовлення № ${order_id}, b3258, 2024-07-06 21:55:25)`,
      stamp: unixTimestamp,
      sig: sig, // Динамический HMAC в виде подписи
      token: 'e_wa_97fd26f52e0505e68ec782ea_test',
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
    console.error('1');
    const order = await this.orderRepository.findOne({
      where: { order_id },
      relations: ['orderBooks', 'orderBooks.book'], // Загружаем книги для orderBooks
    });
    console.error('2');
    if (!order) {
      throw new BadRequestException('Order not found by that id');
    }
    console.error('3');
    const fetchModule = await import('node-fetch');
    const fetch = fetchModule.default;

    const updatedOrder = order;
    console.error('4');

    // Функция задержки
    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    const transactionIds: string[] = [];

    // Используем for...of вместо map для последовательной обработки с задержкой
    for (const [index, orderBook] of order.orderBooks.entries()) {
      const now = new Date();
      const unixTimestamp = Math.floor(now.getTime() / 1000).toString();

      // Генерация HMAC для подписи
      const secret = '1b41d378b24738917d314dff5c816b61';
      const hmac = createHmac('sha1', unixTimestamp);
      const hmacDigest = hmac.update(secret).digest('base64');
      const sig = encodeURIComponent(hmacDigest);

      const bookFormats: string[] = [];
      if (orderBook.book.formatEpub) bookFormats.push('epub');
      if (orderBook.book.formatMobi) bookFormats.push('mobi');
      if (orderBook.book.formatPdf) bookFormats.push('pdf');

      const data = {
        record_reference: orderBook.book.referenceNumber,
        formats: bookFormats.join(','),
        visible_watermark: `Цю книгу купив користувач: user@domain.com (Замовлення № ${order_id}, b3258, ${now.toISOString()})`,
        stamp: unixTimestamp,
        sig: sig,
        token: 'e_wa_97fd26f52e0505e68ec782ea_test',
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

        // Обновляем транзакционный ID в `OrderBook`
        orderBook.transId = transactionId;
        orderBook.orderedFormats = bookFormats.join(',');
        updatedOrder.orderBooks[index] = orderBook;

        console.error('book succeed watermarked');
        transactionIds.push(transactionId);
      } catch (error) {
        console.error('Ошибка при отправке запроса:', error.message);
        throw error;
      }

      // Задержка 5 секунд перед следующим запросом
      await delay(60500);
    }

    console.error('7');
    updatedOrder.orderBooks.map(async (orderBook) => {
      await this.orderBookRepository.update(orderBook.id, orderBook);
    });

    console.error('8');
    return transactionIds; // Возвращаем массив transaction_id для всех книг
  }

  async deliver(transactionId: string): Promise<string> {
    const order = await this.orderRepository.findOne({
      where: { order_id: transactionId },
    });
    console.error(order);
    if (order.status != Status.Payed) {
      return "You didn't pay!";
    }

    // Получаем текущее время
    const now = new Date();

    // Получаем UNIX timestamp в секундах
    const unixTimestamp = Math.floor(now.getTime() / 1000).toString();

    // Генерируем HMAC для создания подписи (sig)
    const secret = '1b41d378b24738917d314dff5c816b61'; // Замените на ваш приватный ключ
    const hmac = createHmac('sha1', unixTimestamp);
    const hmacDigest = hmac.update(secret).digest('base64');
    const sig = encodeURIComponent(hmacDigest);
    const data = {
      trans_id: order.orderBooks[0].transId, // Временно только для 1 книги
      stamp: unixTimestamp, // Временная метка в украинском времени
      sig: sig, // Динамический HMAC в виде подписи
      token: 'e_wa_97fd26f52e0505e68ec782ea_test',
    };

    try {
      const fetchModule = await import('node-fetch');
      const fetch = fetchModule.default;

      const url = 'https://platform.elibri.com.ua/watermarking/deliver';
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

      // Получаем текстовое представление ответа
      await response.text();
      console.log('Making status delievered!');
      order.status = Status.Delievered;
      await this.orderRepository.save(order);

      return 'OK';
    } catch (error) {
      console.error('Ошибка при отправке запроса3:', error.message);

      throw new InternalServerErrorException({
        message: 'Delivery was not successfull',
        cause: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async updateBooksFromArthouse() {
    try {
      this.logsService.save({
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
    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = createHash('sha1')
      .update(
        'sandbox_tV0G1qXrCK21KUqkoPbVrdXt2Y42dmBO7uAn52SW' +
          data +
          'sandbox_tV0G1qXrCK21KUqkoPbVrdXt2Y42dmBO7uAn52SW',
      )
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
    const params = {
      public_key: 'sandbox_i70460379180',
      version: '3',
      action: 'pay',
      amount: amount,
      currency: 'UAH',
      description: description + '      Ідентифікатор замовлення: ' + order_id,
      order_id: order_id,
      sandbox: 1,
    };

    return this.generateSignature(params, order_id);
  }

  async checkout(user_id: number): Promise<{
    data: string;
    signature: string;
    order_id: string;
  }> {
    const order_id = randomUUID();
    const description =
      'Оплата за книги в магазині Bookme, ФОП Науменко Михайло Вікторович. ';
    const params = {
      public_key: 'sandbox_i70460379180',
      version: '3',
      action: 'pay',
      amount: 0,
      currency: 'UAH',
      description: description + 'Ідентифікатор замовлення: ' + order_id,
      order_id: order_id,
      sandbox: 1,
    };

    // save new order
    const user = await this.userRepository.findOne({
      where: { id: user_id },
      relations: ['cart'], // Загрузка связанных книг в корзине пользователя
    });

    if (!user || !user.cart.length) {
      throw new Error('User or cart not found');
    }

    // Создаем заказ
    const order = new Order();
    order.order_id = order_id;
    order.status = Status.Created;
    order.createdAt = new Date();
    order.user = user; // Устанавливаем пользователя для этого заказа

    // Добавляем книги из корзины в orderBooks
    let amount = 0;
    order.orderBooks = user.cart.map((book) => {
      amount += Number(book.price);
      const orderBook = new OrderBook();
      orderBook.order = order;
      orderBook.book = book;
      orderBook.orderedFormats = ''; // Пример формата, можно получить из данных
      orderBook.transId = ''; // Идентификатор транзакции, уникальный для каждой книги. Creating by watermarking
      orderBook.status = Status.Created;
      return orderBook;
    });

    order.amount = amount;
    params.amount = amount;

    // Сохраняем заказ вместе с книгами
    await this.orderRepository.save(order);
    try {
      await this.cartWatermarking(order.order_id);

      return this.generateSignature(params, order_id);
    } catch (e) {
      throw new Error(e.message);
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
    const PUBLIC_KEY = 'sandbox_i70460379180'; // Ваш публичный ключ LiqPay
    const PRIVATE_KEY = 'sandbox_tV0G1qXrCK21KUqkoPbVrdXt2Y42dmBO7uAn52SW'; // Ваш приватный ключ LiqPay
    const API_URL = 'https://www.liqpay.ua/api/request';

    const json = {
      action: 'status',
      version: 3,
      public_key: PUBLIC_KEY,
      order_id: order_id,
    };

    // Кодирование данных в base64
    const data = Buffer.from(JSON.stringify(json)).toString('base64');

    const hash = createHash('sha1');

    const signature = hash
      .update(PRIVATE_KEY + data + PRIVATE_KEY)
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
          response.data.status == 'sandbox' ||
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

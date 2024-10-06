import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Book } from 'src/db/Book';
import { FilterBookDto } from './book.dto';
import { request } from 'https';
import { createHash, createHmac, randomBytes } from 'crypto';
import * as convert from 'xml-js';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as qs from 'qs';
import { Order } from 'src/db/Order';
import { Status } from 'src/db/types';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    private httpService: HttpService,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
  ) {}

  findAll(): Promise<Book[]> {
    return this.booksRepository.find();
  }

  async findOne(id: string) {
    const book = await this.booksRepository.findOne({ where: { id } });
    if (!book) {
      throw new NotFoundException(`Book with id ${id} not found`);
    }
    return book;
  }

  async findBooksByIds(bookIds: any[]) {
    return this.booksRepository.findOneByOrFail(bookIds);
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

  async makeDigestRequest(host, path, method, username, password, postData) {
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
                resolve(JSON.parse(jsonResult).ONIXMessage.Product);
              } catch (error) {
                reject(error);
              }
            });
          });

          if (postData) {
            authReq.write(JSON.stringify(postData));
          }

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
      console.error('Ошибка при отправке запроса:', error.message);
    }
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
      const textResponse = await response.text();
      console.log('Making status delievered!');
      order.status = Status.Delievered;
      await this.orderRepository.save(order);

      return 'OK';
    } catch (error) {
      console.error('Ошибка при отправке запроса:', error.message);
    }
  }

  async updateBooksFromArthouse() {
    try {
      let dumpedBooks;
      this.booksRepository.clear();
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
        for (let i = 0; i < dumpedBooks.length; i++) {
          const serviceBookObject = dumpedBooks[i];
          const recordReference = serviceBookObject.RecordReference;
          const descriptiveDetail = serviceBookObject.DescriptiveDetail;
          const publishingDetail = serviceBookObject.PublishingDetail;
          const collateralDetail = serviceBookObject.CollateralDetail;
          const productSupply = serviceBookObject.ProductSupply;
          const pageCount = descriptiveDetail?.Extent?.ExtentValue?._text;
          const titleText =
            descriptiveDetail?.TitleDetail?.[0]?.TitleElement?.[0]?.TitleText
              ?._text ||
            descriptiveDetail?.TitleDetail?.[0]?.TitleElement?.TitleText
              ?._text ||
            descriptiveDetail?.TitleDetail?.TitleElement?.[0]?.TitleText
              ?._text ||
            descriptiveDetail?.TitleDetail?.TitleElement?.TitleText?._text;
          const formats = this.addFormats(
            serviceBookObject.ProductionDetail.ProductionManifest.BodyManifest
              .BodyResource,
          );
          const personName = [];
          if (descriptiveDetail.NoContributor) {
            personName.push('Без автора');
          } else if (descriptiveDetail.Contributor.length) {
            descriptiveDetail.Contributor.forEach((el) => {
              if (el.length) {
                if (el[0].PersonName._text)
                  personName.push(el[0].PersonName._text);
              } else {
                if (el.PersonName._text) personName.push(el.PersonName._text);
              }
            });
          } else {
            if (!descriptiveDetail.Contributor.UnnamedPersons) {
              personName.push(descriptiveDetail.Contributor.PersonName._text);
            }
          }
          const author = personName.join(', ');
          const artificialTitle = titleText;
          try {
            let updBook = {
              referenceNumber: recordReference._text,
              art: '',
              pages: pageCount || 0,
              title: artificialTitle,
              url: Array.isArray(collateralDetail.SupportingResource)
                ? collateralDetail.SupportingResource[0].ResourceVersion
                    .ResourceLink._text
                : collateralDetail.SupportingResource.ResourceVersion
                    .ResourceLink._text,
              price: productSupply.SupplyDetail.Price.PriceAmount._text,
              lang: Array.isArray(descriptiveDetail.Language)
                ? descriptiveDetail.Language[0].LanguageCode._text
                : descriptiveDetail.Language.LanguageCode._text,
              desc: Array.isArray(collateralDetail.TextContent)
                ? collateralDetail.TextContent[0].Text._cdata
                : collateralDetail.TextContent.Text._cdata,
              author: author,
              pub: publishingDetail.Publisher.PublisherName._text,
              pubDate: Array.isArray(publishingDetail.PublishingDate)
                ? publishingDetail.PublishingDate[0].Date._text
                : publishingDetail.PublishingDate.Date._text,
              genre: Array.isArray(descriptiveDetail.Subject)
                ? descriptiveDetail.Subject[0].SubjectHeadingText._text
                : descriptiveDetail.Subject.SubjectHeadingText._text,
              formatMobi: '',
              formatPdf: '',
              formatEpub: '',
            };
            updBook = Object.assign(updBook, formats);
            this.saveBook(updBook);
            dumpedQuantity += 1;
          } catch (error) {
            console.error(error);
          }
        }
      } while ((dumpedBooks.length = 30 || dumpedQuantity <= 500));
      return { message: 'Dump succeed!', quantity: dumpedQuantity };
    } catch (error) {
      console.error('Error updating books from Arthouse:', error);
      throw error; // Rethrow the error to handle it upstream
    }
  }

  async filterItems(
    params: FilterBookDto,
  ): Promise<{ quantity: number; books: Book[] }> {
    try {
      const queryBuilder = this.booksRepository.createQueryBuilder('book');

      // Dynamic conditions of filtration
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
        queryBuilder.andWhere(authorsConditions.join(' OR '), authorsParams);
      }

      if (params.publishers && params.publishers.length > 0) {
        queryBuilder.andWhere('book.pub IN (:...publishers)', {
          publishers: params.publishers,
        });
      }
      if (params.genre && params.genre.length > 0) {
        const genreConditions = params.genre.map(
          (genre, index) => `book.genre ILIKE :genre_${index}`,
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

      if (params.minPrice !== undefined && params.maxPrice !== undefined) {
        queryBuilder.andWhere('book.price BETWEEN :minPrice AND :maxPrice', {
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
        });
      }

      // Get total count of filtered books
      const totalQuery = queryBuilder.clone();
      const quantity = await totalQuery.getCount();

      // Implementing pagination
      const page = Number(params.page) || 1;
      const pageSize = 24;
      const offset = (page - 1) * pageSize;

      queryBuilder.skip(offset).take(pageSize);

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

  generateSignature(params: any): { data: string; signature: string } {
    const data = Buffer.from(JSON.stringify(params)).toString('base64');
    const signature = createHash('sha1')
      .update(
        'sandbox_tV0G1qXrCK21KUqkoPbVrdXt2Y42dmBO7uAn52SW' +
          data +
          'sandbox_tV0G1qXrCK21KUqkoPbVrdXt2Y42dmBO7uAn52SW',
      )
      .digest('base64');
    return { data, signature };
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

    return this.generateSignature(params);
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
}

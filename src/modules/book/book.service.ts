import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Book } from 'src/db/Book';
import { Filter } from './book.dto';
import { request } from 'https';
import { createHash, randomBytes } from 'crypto';
import * as convert from 'xml-js';

interface IFilter {
  filter: Filter;
  cover: string;
  author: string;
  lang: string;
  pub: string;
  minPrice: number;
  maxPrice: number;
}

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
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

  async updateBooksFromArthouse() {
    try {
      let dumpedBooks;
      let dumpedQuantity = 0;
      this.booksRepository.clear();
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
          const titleDetail = descriptiveDetail.TitleDetail;
          const titleText =
            descriptiveDetail?.TitleDetail?.[0]?.TitleElement?.[0]?.TitleText
              ?._text ||
            descriptiveDetail?.TitleDetail?.[0]?.TitleElement?.TitleText
              ?._text ||
            descriptiveDetail?.TitleDetail?.TitleElement?.[0]?.TitleText
              ?._text ||
            descriptiveDetail?.TitleDetail?.TitleElement?.TitleText?._text;
          const personName =
            serviceBookObject?.DescriptiveDetail?.Contributor?.[0]?.PersonName;
          const author = personName?._text ?? '';
          const artificialTitle = titleText;
          try {
            const updBook = {
              referenceNumber: recordReference._text,
              art: '',
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
              formatMobi: Array.isArray(
                serviceBookObject.ProductionDetail.ProductionManifest
                  .BodyManifest.BodyResource,
              )
                ? serviceBookObject.ProductionDetail.ProductionManifest
                    .BodyManifest.BodyResource[0].ResourceFileLink._text
                : serviceBookObject.ProductionDetail.ProductionManifest
                    .BodyManifest.BodyResource.ResourceFileLink._text,
              formatPdf: '',
              formatEpub: '',
            };
            this.saveBook(updBook);
            dumpedQuantity += 1;
          } catch (error) {
            console.log('Error occured by db dump');
            console.error(error);
          }
        }
      } while (dumpedBooks.length === 30 && dumpedQuantity <= 200);
      return { message: 'Dump succeed', dumpedQuantity };
    } catch (error) {
      console.error('Error updating books from Arthouse:', error);
      throw error; // Rethrow the error to handle it upstream
    }
  }

  async filterItems(params: IFilter): Promise<Book[]> {
    try {
      const queryBuilder = this.booksRepository.createQueryBuilder('book');

      if (params.author) {
        queryBuilder.andWhere('book.author = :author', {
          author: params.author,
        });
      }

      if (params.cover) {
        queryBuilder.andWhere('book.cover = :cover', { cover: params.cover });
      }

      if (params.lang) {
        queryBuilder.andWhere('book.lang = :lang', { lang: params.lang });
      }

      if (params.pub) {
        queryBuilder.andWhere('book.pub = :pub', { pub: params.pub });
      }

      if (params.minPrice !== undefined && params.maxPrice !== undefined) {
        queryBuilder.andWhere('book.price BETWEEN :minPrice AND :maxPrice', {
          minPrice: params.minPrice,
          maxPrice: params.maxPrice,
        });
      }

      const filteredBooks = await queryBuilder.getMany();
      return filteredBooks;
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
}

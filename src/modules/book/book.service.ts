import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Book } from 'src/db/Book';
import { Filter } from './book.dto';
import axios from 'axios';
import { createHash, randomBytes } from 'crypto';

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

  async updateBooksFromArthouse() {
    fetch('https://platform.elibri.com.ua/api/v1/queues/meta/pop', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa('bookme:64db6ffd98a76c2b879c'),
      },
      body: JSON.stringify({
        count: 1,
        testing: 1,
      }),
    })
      .then((response) => {
        //if (!response.ok) {
        //throw new Error('Network response was not ok');
        //}
        return response.text();
      })
      .then((data) => {
        console.log('Response:', data);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
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

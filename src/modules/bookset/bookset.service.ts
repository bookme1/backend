import { Injectable } from '@nestjs/common';
import { CreateBooksetDto } from './dto/create-bookset.dto';
import { UpdateBooksetDto } from './dto/update-bookset.dto';
import { BooksService } from '../book/book.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Bookset } from 'src/db/Bookset';
import { Repository } from 'typeorm';

@Injectable()
export class BooksetService {
  constructor(
    @InjectRepository(Bookset) private bookSetRepository: Repository<Bookset>,
    private readonly booksService: BooksService,
  ) {}

  async createBookSet(createBookSetDto: CreateBooksetDto) {
    const { title, books, header } = createBookSetDto;

    const bookEntities = await this.booksService.findBooksByIds(books);
    const bookSet = this.bookSetRepository.create({
      title,
      books: bookEntities,
      header: {
        ...header,
        createdAt: new Date(),
      },
    });
    return this.bookSetRepository.save(bookSet);
  }

  async findAll(): Promise<Bookset[]> {
    return this.bookSetRepository.find({ relations: ['books'] });
  }

  async findOne(id: number): Promise<Bookset> {
    return this.bookSetRepository.findOne(id, { relations: ['books'] });
  }

  async updateBookSet(id: number, updateBooksetDto: UpdateBooksetDto) {
    const { title, books, header } = updateBooksetDto;

    const bookSet = await this.bookSetRepository.findOne(id, {
      relations: ['books'],
    });

    if (!bookSet) {
      throw new Error('Book set not found');
    }

    if (title) {
      bookSet.title = title;
    }

    if (books) {
      const bookEntities = await this.booksService.findBooksByIds(books);
      bookSet.books = bookEntities;
    }

    if (header?.editedBy) {
      bookSet.header.editedBy = header.editedBy;
    }

    return this.bookSetRepository.save(bookSet);
  }

  async remove(id: number): Promise<void> {
    await this.bookSetRepository.delete(id);
  }
}

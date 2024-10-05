import { Injectable } from '@nestjs/common';
import { CreateBooksetDto } from './dto/create-bookset.dto';
// import { UpdateBooksetDto } from './dto/update-bookset.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BooksService } from '../book/book.service';
import { Bookset } from 'src/db/Bookset';

@Injectable()
export class BooksetService {
  constructor(
    @InjectRepository(Bookset) private bookSetRepository: Repository<Bookset>,
    private readonly booksService: BooksService,
  ) {}

  async createBookSet(createBooksetDto: CreateBooksetDto): Promise<Bookset> {
    const { title, books, header } = createBooksetDto;

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

  // async updateBookSet(
  //   id: number,
  //   updateBooksetDto: UpdateBooksetDto,
  // ): Promise<Bookset> {
  //   const { title, books, header } = updateBooksetDto;

  //   const bookSet = await this.bookSetRepository.findOne(id, {
  //     relations: ['books'],
  //   });

  //   if (!bookSet) {
  //     throw new Error('Book set not found');
  //   }

  //   if (title) {
  //     bookSet.title = title;
  //   }

  //   if (books) {
  //     const bookEntities = await this.booksService.findBooksByIds(books);
  //     bookSet.books = bookEntities;
  //   }

  //   if (header.editedBy) {
  //     bookSet.header.editedBy = header.editedBy;
  //   }

  //   return this.bookSetRepository.save(bookSet);
  // }

  async findAll(): Promise<Bookset[]> {
    return this.bookSetRepository.find({ relations: ['books'] });
  }

  // async findOne(id: string): Promise<Bookset> {
  //   return this.bookSetRepository.findOne(id, { relations: ['books'] });
  // }

  async remove(id: number): Promise<void> {
    await this.bookSetRepository.delete(id);
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateBooksetDto } from './dto/create-bookset.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BooksService } from '../book/book.service';
import { Bookset } from 'src/db/Bookset';
import { UpdateBooksetDto } from './dto/update-bookset.dto';

@Injectable()
export class BooksetService {
  constructor(
    @InjectRepository(Bookset) private bookSetRepository: Repository<Bookset>,
    private readonly booksService: BooksService,
  ) {}

  async createBookSet(createBooksetDto: CreateBooksetDto): Promise<Bookset> {
    const { title, books, header } = createBooksetDto;

    const bookEntities = await this.booksService.findBooksByIds(books);
    const bookSet = await this.bookSetRepository.create({
      title,
      books: bookEntities,
      header: {
        ...header,
        createdAt: new Date(),
      },
    });

    bookSet.books = bookEntities;

    return await this.bookSetRepository.save(bookSet);
  }

  async updateBookSet(
    id: number,
    updateBooksetDto: UpdateBooksetDto,
  ): Promise<Bookset> {
    const { title, books, header } = updateBooksetDto;

    // check if bookset exists
    const bookSet = await this.bookSetRepository.findOne({
      where: { id },
      relations: ['books'],
    });

    if (!bookSet) {
      throw new NotFoundException(`Book set with ID ${id} not found`);
    }

    // Start transaction
    await this.bookSetRepository.manager.transaction(
      async (entityManager: EntityManager) => {
        // Update title
        if (title) {
          bookSet.title = title;
        }

        // Update books
        if (books && books.length > 0) {
          const bookEntities = await this.booksService.findBooksByIds(books);

          if (bookEntities.length !== books.length) {
            throw new BadRequestException('One or more books were not found');
          }

          bookSet.books = bookEntities;
        }

        // Update header
        bookSet.header.editedBy = header?.editedBy || bookSet.header.editedBy;
        bookSet.header.editedAt = new Date();

        // Save changes
        await entityManager.save(bookSet);
      },
    );

    // Return updated bookset
    return this.bookSetRepository.findOne({
      where: { id },
      relations: ['books'],
    });
  }

  async findAll(): Promise<Bookset[]> {
    return this.bookSetRepository.find({
      relations: ['books'],
    });
  }

  async findOne(id: number): Promise<Bookset> {
    return this.bookSetRepository.findOne({
      where: { id },
      relations: ['books'],
    });
  }

  async remove(id: number): Promise<void> {
    await this.bookSetRepository.delete(id);
  }
}

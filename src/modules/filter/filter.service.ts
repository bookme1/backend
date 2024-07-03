import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filter } from 'src/db/Filter';
import { Book } from 'src/db/Book';

@Injectable()
export class FilterService {
  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    @InjectRepository(Filter)
    private filterRepository: Repository<Filter>,
  ) {}

  async getGenres() {
    const books = await this.booksRepository.find();
    const genreCount = books.reduce((acc, book) => {
      acc[book.genre] = (acc[book.genre] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(genreCount).map(([genre, count]) => ({
      genre,
      count,
    }));
  }

  async getFilters() {
    const books = await this.booksRepository.find();

    const authors = new Set<string>();
    const publishers = new Set<string>();
    const genres = new Set<string>();
    const languages = new Set<string>();
    let minPrice = Infinity;
    let maxPrice = 0;

    books.forEach((book) => {
      const bookAuthors = book.author.split(', ');

      bookAuthors.forEach((author) => {
        authors.add(author.trim());
      });

      publishers.add(book.pub);
      genres.add(book.genre);
      languages.add(book.lang);

      const price = parseFloat(book.price);
      if (!isNaN(price)) {
        if (price < minPrice) {
          minPrice = price;
        }
        if (price > maxPrice) {
          maxPrice = price;
        }
      }
    });

    const uniqueAuthors = Array.from(authors);
    const uniquePublishers = Array.from(publishers);
    const uniqueGenres = Array.from(genres);
    const uniqueLanguages = Array.from(languages);

    return {
      authors: uniqueAuthors,
      publishers: uniquePublishers,
      genres: uniqueGenres,
      languages: uniqueLanguages,
      minPrice,
      maxPrice,
    };
  }
}

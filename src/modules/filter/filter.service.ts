import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filter } from 'src/db/Filter';
import { Book } from 'src/db/Book';
import { normalizeGenres, reverseGenreMap } from './utils';

@Injectable()
export class FilterService {
  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    @InjectRepository(Filter)
    private filterRepository: Repository<Filter>,
  ) {}

  async getGenres() {
    const rawGenres = await this.booksRepository
      .createQueryBuilder('book')
      .select(
        `
      TRIM(BOTH FROM substring(book.genre from '^[^/]+')) AS main_genre, 
      TRIM(BOTH FROM substring(book.genre from '[^/]+ / ([^/]+)')) AS sub_genre,
      COUNT(book.id) as count
    `,
      ) // Get main genre and subgenre
      .groupBy('main_genre, sub_genre') // Group by main and subgenre
      .where(
        "book.genre IS NOT NULL AND book.genre != '' AND book.genre NOT LIKE '%�%'",
      ) // Filter incorrect genres
      .getRawMany();

    return this.buildGenreTree(rawGenres);
  }

  buildGenreTree(
    rawGenres: { main_genre: string; sub_genre: string; count: number }[],
  ) {
    const genreTree = {};

    rawGenres.forEach((row) => {
      const { main_genre, sub_genre, count } = row;

      if (!genreTree[main_genre]) {
        genreTree[main_genre] = {
          genre: main_genre,
          count: 0,
          children: [],
        };
      }

      // Reduce book quantity for main genre
      genreTree[main_genre].count += Number(count);

      // Add subgenre if it exists
      if (sub_genre && sub_genre !== main_genre) {
        genreTree[main_genre].children.push({
          genre: sub_genre,
          count: Number(count),
        });
      }
    });

    // Преобразуем объект в массив для возвращения
    return normalizeGenres(Object.values(genreTree));
  }

  async getFilters(q: string, filters?: { genre?: string }) {
    const queryBuilder = this.booksRepository.createQueryBuilder('book');

    if (q && q.trim() !== '') {
      queryBuilder.where('LOWER(book.title) LIKE LOWER(:q)', {
        q: `${q}%`,
      });
    }

    if (filters?.genre) {
      const originalGenres =
        reverseGenreMap[filters.genre] || new Set([filters.genre]);
      queryBuilder.andWhere('book.genre IN (:...genres)', {
        genres: Array.from(originalGenres),
      });
    }

    const books = await queryBuilder.getMany();

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

      // Reversed genre mapping
      if (reverseGenreMap[book.genre]) {
        reverseGenreMap[book.genre].forEach((originalGenre) =>
          genres.add(originalGenre),
        );
      } else {
        genres.add(book.genre);
      }

      languages.add(book.lang);

      const price = book.price;
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
      minPrice: minPrice === Infinity ? 0 : minPrice,
      maxPrice: maxPrice === 0 ? 0 : maxPrice,
    };
  }
}

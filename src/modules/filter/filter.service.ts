import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filter } from 'src/db/Filter';
import { Book } from 'src/db/Book';

// interface GenreBook {
//   genre: string;
// }

interface GenreNode {
  count: number;
  subgenres: { [key: string]: GenreNode };
}

@Injectable()
export class FilterService {
  constructor(
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
    @InjectRepository(Filter)
    private filterRepository: Repository<Filter>,
  ) {}

  async getGenres() {
    const books: Book[] = await this.booksRepository.find();

    // Creating object for creating tree structure
    const genreTree: { [key: string]: GenreNode } = {};

    // Function for inserting nodes into tree object
    const insertGenre = (
      path: string[],
      node: { [key: string]: GenreNode },
    ) => {
      const [head, ...tail] = path;
      if (!node[head]) {
        node[head] = { count: 0, subgenres: {} };
      }
      node[head].count += 1; // Increase books quantity in current level
      if (tail.length > 0) {
        insertGenre(tail, node[head].subgenres);
      }
    };

    // Filling in tree structured object
    books.forEach((book) => {
      const path = book.genre.split(' / ');
      insertGenre(path, genreTree);
    });

    // A function to convert the tree structure into an array of objects
    const treeToArray = (node: { [key: string]: GenreNode }) => {
      return Object.entries(node).map(([genre, data]) => ({
        genre,
        count: data.count,
        subgenres: treeToArray(data.subgenres),
      }));
    };

    return treeToArray(genreTree);
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

  async getFilteredBooks(searchOnlyTitles: boolean = false) {
    const books = await this.booksRepository.find();

    if (searchOnlyTitles) {
      return books.map((book) => ({ id: book.id, title: book.title }));
    }

    return books;
  }
}

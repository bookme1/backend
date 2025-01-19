import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/db/User';
import { BookType } from './user.dto';
import { Book } from 'src/db/Book';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>,
    @InjectRepository(Book)
    private booksRepository: Repository<Book>,
  ) {}

  findAll(): Promise<User[]> {
    return this.repository.find();
  }

  async getUserData(userId: number) {
    const user = await this.getById(userId);

    // Set last user activity
    await this.updateLoggedDate(userId, '');

    return { ...this.removePasswordFromUser(user) };
  }

  async getUserBooks(type: BookType, userId: number) {
    // Set last user activity
    await this.updateLoggedDate(userId, '');

    const queryBuilder = this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect(`user.${type.toLowerCase()}`, 'book') // join for bounded books
      .where('user.id = :id', { id: userId })
      .select([
        'user.id',
        'book.id',
        'book.title', // Выбираем нужные поля из книги
        'book.author',
        'book.price',
        'book.url',
        'book.formatMobi',
        'book.formatPdf',
        'book.formatEpub',
      ]);

    // Выполняем запрос и возвращаем результат
    return await queryBuilder.getOne();
  }

  async getUserBooksQuantity(type: BookType, userId: number): Promise<number> {
    // Обновите дату последней активности пользователя
    await this.updateLoggedDate(userId, '');

    // Создайте запрос к таблице книг с подсчетом количества книг для пользователя
    const countResult = await this.repository
      .createQueryBuilder('user')
      .leftJoinAndSelect(`user.${type.toLowerCase()}`, 'book')
      .where('user.id = :id', { id: userId })
      .select('COUNT(*)', 'count') // Считайте количество
      .getRawOne(); // Получите одно значение

    return countResult ? Number(countResult.count) : 0; // Верните 0, если книг нет
  }

  async addUserBook(type: BookType, userId: number, bookId: string) {
    if (type == null) return new BadRequestException('Type is not provided');

    const user = await this.getById(userId);
    const book = await this.booksRepository.findOne({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    // Set last user activity
    await this.updateLoggedDate(userId, '');

    if (type == BookType.Fav) {
      if (user.fav.some((b) => b.id === book.id)) {
        return new BadRequestException('Book already exists');
      }
      user.fav.push(book);
    } else if (type == BookType.Cart) {
      if (user.cart.some((b) => b.id === book.id)) {
        return new BadRequestException('Book already exists');
      }
      user.cart.push(book);
    }

    await this.repository.save(user);
    return { message: 'successfully', bookId };
  }

  async removeUserBook(type: BookType, userId: number, bookId: string) {
    if (type == null) return new BadRequestException('Type is not provided');

    const user = await this.getById(userId);

    // Set last user activity
    await this.updateLoggedDate(userId, '');

    const book = await this.booksRepository.findOne({ where: { id: bookId } });
    if (!book) {
      throw new NotFoundException('Book not found');
    }

    if (type == BookType.Fav) {
      const index = user.fav.findIndex((b) => b.id === book.id);
      if (index > -1) {
        user.fav.splice(index, 1);
      }
      await this.repository.save(user);
      return user.fav;
    } else if (type == BookType.Cart) {
      const index = user.cart.findIndex((b) => b.id === book.id);
      if (index > -1) {
        user.cart.splice(index, 1);
      }
      await this.repository.save(user);
      return user.cart;
    }

    return new BadRequestException();
  }

  async getOrderedBooks(userId: number) {
    const user = await this.getById(userId);
    if (!user) return new BadRequestException('user not found');

    return new BadRequestException();
  }

  async getById(id: number): Promise<User> {
    const user = await this.repository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  getByEmail(email: string) {
    return this.repository.findOne({ where: { email } });
  }

  async updatePassword(id: number, password: string) {
    const user = await this.getById(id);
    user.password = password;

    return await this.saveUser(user);
  }

  async saveUser(payload: Partial<User>): Promise<User | null> {
    return await this.repository.save(payload);
  }

  async remove(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  removePasswordFromUser(user: User) {
    const userData = { ...user };
    delete userData.password; // delete password from userData

    return userData;
  }

  async updateLoggedDate(
    userId: number | undefined,
    userEmail: string | undefined,
  ) {
    let user;
    if (userId) {
      user = await this.getById(userId);
    } else if (userEmail) {
      user = await this.getByEmail(userEmail);
    }

    if (!user) {
      return false;
    }

    user.lastActiveAt = new Date();
  }

  async markEmailAsVerified(userId: number): Promise<void> {
    await this.repository.update(userId, { verified: true });
  }
}

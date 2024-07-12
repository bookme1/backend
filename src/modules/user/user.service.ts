import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/db/User';
import { BookType } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private repository: Repository<User>,
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
    const user = await this.getById(userId);
    // Set last user activity
    await this.updateLoggedDate(userId, '');

    if (type == BookType.Cart) return user.cart;
    else if (type == BookType.Fav) return user.fav;

    return new BadRequestException();
  }

  async addUserBook(type: BookType, userId: number, bookId: string) {
    if (type == null) return new BadRequestException('Type is not provided');

    const user = await this.getById(userId);

    // Set last user activity
    await this.updateLoggedDate(userId, '');

    if (type == BookType.Fav) {
      if (user.fav.includes(bookId)) {
        return new BadRequestException('Book already exists');
      }
      user.fav.push(bookId);
    } else if (type == BookType.Cart) {
      if (user.cart.includes(bookId)) {
        return new BadRequestException('Book already exists');
      }
      user.cart.push(bookId);
    }

    await this.repository.save(user);
    return { message: 'successfully', bookId };
  }

  async removeUserBook(type: BookType, userId: number, bookId: string) {
    if (type == null) return new BadRequestException('Type is not provided');

    const user = await this.getById(userId);

    // Set last user activity
    await this.updateLoggedDate(userId, '');

    if (type == BookType.Fav) {
      const index = user.fav.findIndex((val) => val === bookId);
      if (index > -1) {
        user.fav.splice(index, 1);
      }
      await this.repository.save(user);
      return user.fav;
    } else if (type == BookType.Cart) {
      const index = user.cart.findIndex((val) => val === bookId);
      if (index > -1) {
        user.cart.splice(index, 1);
      }
      await this.repository.save(user);
      return user.cart;
    }

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
}

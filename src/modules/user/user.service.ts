import { BadRequestException, Injectable } from '@nestjs/common';
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

    return { ...this.removePasswordFromUser(user) };
  }

  async getUserBooks(type: BookType, userId: number) {
    const user = await this.getById(userId);
    if (type == BookType.Cart) return user.cart;
    else if (type == BookType.Fav) return user.fav;

    return new BadRequestException();
  }

  async addUserBook(type: BookType, userId: number, bookId: string) {
    const user = await this.getById(userId);

    if (type == BookType.Fav) {
      if (user.fav.includes(bookId)) {
        return new BadRequestException();
      }
      user.fav.push(bookId);
    } else if (type == BookType.Cart) {
      if (user.cart.includes(bookId)) {
        return new BadRequestException();
      }
      user.cart.push(bookId);
    }

    this.repository.update(user.id, user);
    return { message: 'successfully', bookId };
  }

  async removeUserBook(type: BookType, userId: number, bookId: string) {
    const user = await this.getById(userId);

    if (type == BookType.Fav) {
      const index = user.fav.findIndex((val) => val == bookId);
      user.fav.splice(index, 1);
      this.repository.update(user.id, user);
      return user.fav;
    } else if (type == BookType.Cart) {
      const index = user.cart.findIndex((val) => val == bookId);
      user.cart.splice(index, 1);
      this.repository.update(user.id, user);
      return user.cart;
    }

    return new BadRequestException();
  }

  getById(id: number) {
    return this.repository.findOne({ where: { id } });
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
}

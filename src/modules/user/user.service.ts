import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from 'src/db/User';

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

  async getUserFavBooks(userId: number) {
    const user = await this.getById(userId);

    return user.favBooks;
  }

  async addUserFavBook(userId: number, bookId: string) {
    const user = await this.getById(userId);
    if (user.favBooks.includes(bookId)) {
      return new BadRequestException();
    }
    user.favBooks.push(bookId);
    this.repository.update(user.id, user);
    return { message: 'successfully', bookId };
  }

  async removeUserFavBook(userId: number, bookId: string) {
    const user = await this.getById(userId);
    const index = user.favBooks.findIndex((val) => val == bookId);
    user.favBooks.splice(index, 1);
    this.repository.update(user.id, user);
    return user.favBooks;
  }

  async getUserCartBooks(userId: number) {
    const user = await this.getById(userId);

    return user.cartBooks;
  }

  async addUserCartBook(userId: number, bookId: string) {
    const user = await this.getById(userId);
    if (user.cartBooks.includes(bookId)) {
      return new BadRequestException();
    }
    user.cartBooks.push(bookId);
    this.repository.update(user.id, user);
    return { message: 'successfully', bookId };
  }

  async removeUserCartBook(userId: number, bookId: string) {
    const user = await this.getById(userId);
    const index = user.cartBooks.findIndex((val) => val == bookId);
    user.cartBooks.splice(index, 1);
    this.repository.update(user.id, user);
    return user.cartBooks;
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

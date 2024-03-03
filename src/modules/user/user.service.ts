import { Injectable } from '@nestjs/common';
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

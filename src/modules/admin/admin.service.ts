import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { User } from 'src/db/User';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getAllUsers() {
    return await this.usersRepository.find();
  }

  async deleteEmptyUsers() {
    const result = await this.usersRepository
      .createQueryBuilder()
      .delete()
      .from(User)
      .where(
        new Brackets((qb) => {
          qb.where("email IS NULL OR email = ''")
            .andWhere("username IS NULL OR username = ''")
            .andWhere("password IS NULL OR password = ''");
        }),
      )
      .execute();

    return {
      message: `${result.affected} users deleted`,
    };
  }
}

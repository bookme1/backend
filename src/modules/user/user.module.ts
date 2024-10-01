import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UsersController } from './user.controller';
import { User } from 'src/db/User';
import { BooksModule } from 'src/modules/book/book.module';

@Module({
  imports: [TypeOrmModule.forFeature([User]), BooksModule],
  providers: [UserService],
  controllers: [UsersController],
  exports: [UserService, TypeOrmModule],
})
export class UsersModule {}

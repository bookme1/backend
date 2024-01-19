import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BooksService } from './book.service';
import { BooksController } from './book.controller';
import { Book } from './book.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Book])],
  providers: [BooksService],
  controllers: [BooksController],
  exports: [TypeOrmModule],
})
export class UsersModule {}

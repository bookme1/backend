import { Injectable } from '@nestjs/common';
import { CreateBooksetDto } from './dto/create-bookset.dto';
import { UpdateBooksetDto } from './dto/update-bookset.dto';

@Injectable()
export class BooksetService {
  create(createBooksetDto: CreateBooksetDto) {
    return 'This action adds a new bookset';
  }

  findAll() {
    return `This action returns all bookset`;
  }

  findOne(id: number) {
    return `This action returns a #${id} bookset`;
  }

  update(id: number, updateBooksetDto: UpdateBooksetDto) {
    return `This action updates a #${id} bookset`;
  }

  remove(id: number) {
    return `This action removes a #${id} bookset`;
  }
}

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Filter } from 'src/db/Filter';

@Injectable()
export class FilterService {
  constructor(
    @InjectRepository(Filter)
    private booksRepository: Repository<Filter>,
  ) {}

  // async getFilters() {
  //   const book = await this.booksRepository.findOne({ where: { id} });

  //   return book;
  // }
  // async setFilters() {
  //   const book = await this.booksRepository.findOne({ where: { id } });

  // return book;
  // }
}

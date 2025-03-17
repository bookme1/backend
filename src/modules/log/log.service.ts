import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Log } from 'src/db/Log';

@Injectable()
export class LogsService {
  constructor(
    @InjectRepository(Log)
    private logsRepository: Repository<Log>,
  ) {}

  findAll(): Promise<Log[]> {
    return this.logsRepository.find();
  }

  async findOne(id: string) {
    const log = await this.logsRepository.findOne({
      where: { id },
    });
    if (!log) {
      throw new NotFoundException(`Log with id ${id} not found`);
    }
    return log;
  }

  async save(log): Promise<Log> {
    try {
      return this.logsRepository.save(log);
    } catch (error) {
      return error.message;
    }
  }

  async delete(id: string): Promise<void> {
    await this.logsRepository.delete(id);
  }
}

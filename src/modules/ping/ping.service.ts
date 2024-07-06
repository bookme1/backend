import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ping } from 'src/db/Ping';
import { PingDTO } from './ping.dto';

@Injectable()
export class PingService {
  constructor(
    @InjectRepository(Ping)
    private pingRepository: Repository<Ping>,
  ) {}

  async acceptPing(data: PingDTO) {
    const { transactionId, pdfLink, epubLink, mobiLink } = data;
    const newPing = {
      pdfLink,
      epubLink,
      mobiLink,
      transactionId,
    };

    await this.pingRepository.save(newPing);
  }
}

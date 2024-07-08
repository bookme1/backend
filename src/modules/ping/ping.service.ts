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

  async acceptPing(data) {
    const { trans_id, pdf_link, epub_link, mobi_link, status_link } = data;
    const newPing = {
      pdfLink: pdf_link,
      epubLink: epub_link,
      mobiLink: mobi_link,
      statusLink: status_link,
      transactionId: trans_id,
    };

    await this.pingRepository.save(newPing);
  }

  async getAllPings() {
    return await this.pingRepository.find();
  }
}

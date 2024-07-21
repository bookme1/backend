import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ping } from 'src/db/Ping';

@Injectable()
export class PingService {
  constructor(
    @InjectRepository(Ping)
    private pingRepository: Repository<Ping>,
  ) {}

  async acceptPing(data) {
    // console.log(data);
    // return data;
    const { trans_id, pdf_link, epub_link, mobi_link, status_link } = data;
    const newPing = new Ping();
    newPing.pdfLink = pdf_link;
    newPing.epubLink = epub_link;
    newPing.mobiLink = mobi_link;
    newPing.statusLink = status_link;
    newPing.transactionId = trans_id;

    await this.pingRepository.save(newPing);

    return newPing;
  }

  async getAllPings() {
    return await this.pingRepository.find();
  }
}

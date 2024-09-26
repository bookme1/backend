import { Module } from '@nestjs/common';
import { BooksetService } from './bookset.service';
import { BooksetController } from './bookset.controller';

@Module({
  controllers: [BooksetController],
  providers: [BooksetService],
})
export class BooksetModule {}

import { Test, TestingModule } from '@nestjs/testing';
import { BooksetController } from './bookset.controller';
import { BooksetService } from './bookset.service';

describe('BooksetController', () => {
  let controller: BooksetController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BooksetController],
      providers: [BooksetService],
    }).compile();

    controller = module.get<BooksetController>(BooksetController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

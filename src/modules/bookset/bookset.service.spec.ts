import { Test, TestingModule } from '@nestjs/testing';
import { BooksetService } from './bookset.service';

describe('BooksetService', () => {
  let service: BooksetService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [BooksetService],
    }).compile();

    service = module.get<BooksetService>(BooksetService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

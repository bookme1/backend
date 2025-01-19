import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { OnixService } from './onix.service';

@ApiTags('onix')
@Controller('api/onix')
export class OnixController {
  constructor(private readonly service: OnixService) {}
}

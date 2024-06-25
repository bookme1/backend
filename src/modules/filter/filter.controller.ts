import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FilterService } from './filter.service';

@ApiTags('filter')
@Controller('api/filter')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  //Get filters
  @Get('')
  public getAll() {
    // return this.filterService.getFilters();
  }

  //Update filters
  @Post('')
  public setAll() {
    // return this.filterService.setFilters();
  }
}

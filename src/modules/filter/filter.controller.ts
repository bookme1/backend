import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FilterService } from './filter.service';

@ApiTags('filter')
@Controller('api/filter')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  //Get filters
  @Get('')
  public getFilters() {
    return this.filterService.getFilters();
  }

  //Get genres
  // @Get('/genre')
  // public getGenres() {
  //   return this.filterService.getGenres();
  // }
}

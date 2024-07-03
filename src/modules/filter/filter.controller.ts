import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FilterService } from './filter.service';

@ApiTags('filter')
@Controller('api/filter')
export class FilterController {
  constructor(private readonly filterService: FilterService) {}

  //Get genres
  @Get('')
  public getFilters() {
    return this.filterService.getGenres();
  }

  //запросы поменяны, поменять после деплоя!!!!!!!!!!!!!!!
  //Get filter
  @Get('/filters')
  public getGenres() {
    return this.filterService.getFilters();
  }
}

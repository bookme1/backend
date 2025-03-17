import {
  Controller,
  Get,
  Inject,
  Query,
  UseInterceptors,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FilterService } from './filter.service';
import { CACHE_MANAGER, CacheInterceptor } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { RedisService } from '../redis/redis.service';

@ApiTags('filter')
@Controller('api/filter')
export class FilterController {
  constructor(
    private readonly filterService: FilterService,
    private readonly redisService: RedisService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  //Get genres
  @Get('')
  @UseInterceptors(CacheInterceptor)
  public async getFilters() {
    const cachedGenres = await this.redisService.get('genres');

    //If we have cached genres -> return it
    if (cachedGenres != undefined) {
      return cachedGenres;
    }

    //If we don't have cached data -> compute it and set to cache store
    const genres = await this.filterService.getGenres();
    await this.redisService.set(
      'allGenres',
      genres,
      1000 * 60 * 60 * 24 * 7, // 1 week
    ); // genres for catalog

    return genres;
  }

  //запросы поменяны, поменять после деплоя!!!!!!!!!!!!!!!
  //Get filter
  @Get('/filters')
  public getGenres(@Query() { q }: { q: string }) {
    return this.filterService.getFilters(q);
  }
}

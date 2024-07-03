import { MiddlewareConsumer, Module } from '@nestjs/common';

import { AppLoggerMiddleware } from './app.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/modules/user/user.module';
import { BooksModule } from 'src/modules/book/book.module';
import config from 'src/db/ormconfig';
import { AuthModule } from '../auth/auth.module';
import { FilterModule } from '../filter/filter.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(config),
    UsersModule,
    BooksModule,
    AuthModule,
    FilterModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}

import { MiddlewareConsumer, Module } from '@nestjs/common';

import { AppLoggerMiddleware } from './app.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/user/user.module';
import { BooksModule } from 'src/book/book.module';
import config from 'src/db/ormconfig';

@Module({
  imports: [TypeOrmModule.forRoot(config), UsersModule, BooksModule],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}

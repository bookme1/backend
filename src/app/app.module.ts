import { MiddlewareConsumer, Module } from '@nestjs/common';

import { AppLoggerMiddleware } from './app.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { UsersModule } from 'src/user/user.module';
import { Book } from 'src/book/book.entity';
import { BooksModule } from 'src/book/book.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'dpg-cmi4a8i1hbls738dgsu0-a.frankfurt-postgres.render.com',
      port: 5432,
      username: 'bookme_api_user',
      password: 'SjsqYSORXEekm2D9sKf8d2moibqdymUH',
      database: 'bookme_api',
      entities: [User, Book],
      synchronize: true,
      ssl: { rejectUnauthorized: false },
    }),
    UsersModule,
    BooksModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}

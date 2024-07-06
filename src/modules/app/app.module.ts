import { MiddlewareConsumer, Module } from '@nestjs/common';

import { AppLoggerMiddleware } from './app.middleware';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/modules/user/user.module';
import { BooksModule } from 'src/modules/book/book.module';
import config from 'src/db/ormconfig';
import { AuthModule } from '../auth/auth.module';
import { FilterModule } from '../filter/filter.module';
import { PingModule } from '../ping/ping.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(config),
    UsersModule, // all operations with user
    BooksModule, // all operations with books
    AuthModule, // all operations with authentications of user
    FilterModule, // all operations for filtering books
    PingModule, // all operations to receive data from platform Elibri
    AdminModule, // all operations to send data to admin panel(users,books,operations, metrics)
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
  }
}

import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from 'src/user/user.entity';
import { Book } from 'src/book/book.entity';
import { getConfig } from 'src/config';

const envConfig = getConfig();

const config: TypeOrmModuleOptions = {
  type: 'postgres',
  host: envConfig.DB_HOST,
  port: 5432,
  username: process.env.DB_USERNAME || 'bookme_api_user',
  password: process.env.DB_PASSWORD || 'SjsqYSORXEekm2D9sKf8d2moibqdymUH',
  database: 'bookme_api',
  entities: [User, Book],
  synchronize: true,
  ssl: { rejectUnauthorized: false },
};

export default config;

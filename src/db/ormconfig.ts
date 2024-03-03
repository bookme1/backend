import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './User';
import { Book } from './Book';
import { getConfig } from 'src/config';

const envConfig = getConfig();

const config: TypeOrmModuleOptions = {
  type: 'postgres',
  host: envConfig.DB_HOST,
  port: envConfig.DB_PORT,
  username: process.env.DB_USERNAME || 'bookme_api_user',
  password: process.env.DB_PASSWORD || 'SjsqYSORXEekm2D9sKf8d2moibqdymUH',
  database: 'bookme_api',
  entities: [User, Book],
  synchronize: true,
  ssl: { rejectUnauthorized: false },
  migrations: [`${__dirname}/**/migration/*.{ts,js}`],
};

export default config;

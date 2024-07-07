import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { User } from './User';
import { Book } from './Book';
import { getConfig } from 'src/config';
import { Ping } from './Ping';
import { Order } from './Order';
import { OrderBook } from './OrderBook';
//import { Filter } from './Filter';

const envConfig = getConfig();

const config: TypeOrmModuleOptions = {
  type: 'postgres',
  host: envConfig.DB_HOST,
  port: envConfig.DB_PORT,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: 'bookme_api',
  entities: [User, Book, Ping, Order, OrderBook], // Filter has to be there too
  synchronize: true,
  ssl: { rejectUnauthorized: false },
  migrations: [`src/db/migrations/*.{ts,js}`],
};

export default config;

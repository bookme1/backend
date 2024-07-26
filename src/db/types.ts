import { Book } from './Book';

export enum Role {
  User = 'User',
  Moderator = 'Moderator',
  Admin = 'Admin',
  Author = 'Author',
}

export enum Status {
  Unknown = 'Unknown', // Не зрозумілий статус
  Created = 'Created', // Створена вотермарка
  Loading = 'Loading', // Завантаження статусу
  Error = 'Error', // Сталась помилка при оплаті
  Overtime = 'Overtime', // Сталась помилка при оплаті
  Cancelled = 'Cancelled', // Відмінено кліентом
  Payed = 'Payed', // Підтверджена оплата від платіжної системи
  Delievered = 'Delievered', // Замовлена доставка, очікуеться пінг
  Succeed = 'Succeed', // Доставлено кліенту на акаунт
}

export interface IOrderBook {
  book: Book;
  orderedFormats: string; // List of formats in string with separator ", "
  transId: string;
}

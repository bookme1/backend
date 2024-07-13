import { Book } from './Book';

export enum Role {
  User = 'User',
  Moderator = 'Moderator',
  Admin = 'Admin',
}

export enum Status {
  Unknown = 'Unknown', // Не зрозумілий статус
  Created = 'Created', // Створена вотермарка
  Loading = 'Loading', // Завантаження статусу
  Error = 'Error', // Сталась помилка при оплаті
  Overtime = 'Overtime', // Сталась помилка при оплаті
  Cancelled = 'Cancelled', // Відмінено кліентом
  Payed = 'Payed', // Підтверджена оплата від платіжної системи
  Succeed = 'Succeed',
  Success = 'Success', // Доставлено кліенту на акаунт
}

export interface IOrderBook {
  book: Book;
  orderedFormats: string; // List of formats in string with separator ", "
  transId: string;
}

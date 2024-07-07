import { Book } from './Book';

export enum Role {
  User = 'User',
  Moderator = 'Moderator',
  Admin = 'Admin',
}

export enum Status {
  Unknown = 'Unknown',
  Created = 'Created',
  Loading = 'Loading',
  Cancelled = 'Cancelled',
  Succeed = 'Succeed',
}

export interface IOrderBook {
  book: Book;
  orderedFormats: string; // List of formats in string with separator ", "
  transId: string;
}

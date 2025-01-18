import { Request } from 'express';
import { User } from 'src/db/User';

export interface AuthenticatedRequest extends Request {
  user: User;
}

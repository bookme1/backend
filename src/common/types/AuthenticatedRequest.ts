import { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: { userId: number; userName: string };
}

export interface GoogleAuthenticatedRequest extends Request {
  user: { email: string; name: string };
}

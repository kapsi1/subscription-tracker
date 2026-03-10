import type { Request } from 'express';

export interface UserPayload {
  userId: string;
  email: string;
}

export interface RequestWithUser extends Request {
  user: UserPayload;
}

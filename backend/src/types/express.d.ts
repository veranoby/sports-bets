// Type extensions for Express Request
import { User } from '../models';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      sessionToken?: string;
    }
  }
}

export {};

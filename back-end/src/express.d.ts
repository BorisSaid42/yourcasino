import { Credentials } from './auth/dto/jwt-credentials.dto';

declare global {
  namespace Express {
    export interface Request {
      credentials?: Credentials; // TODO: replace with actual type
    }
  }
}

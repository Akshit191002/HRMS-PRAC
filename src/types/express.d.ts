import { UserRole } from "../auth/constants/roles";

declare global {
  namespace Express {
    interface Request {
      user?: {
        uid: string;
        email: string;
        role?: UserRole | null;
      };
    }
  }
}

import { Request } from 'express';
import { User } from '@prisma/client';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

/** Aplicación cliente identificada por su API Key (Lab 6). */
export interface ApiClientIdentity {
  id: number;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Lo fija apiKeyMiddleware cuando la API Key es válida y el cliente está activo. */
      apiClient?: ApiClientIdentity;
    }
  }
}

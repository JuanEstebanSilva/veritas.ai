import { Role } from '@prisma/client';
import { generarToken } from '../src/utils/jwt.util';

/** Token firmado igual que en el login real (HS256, sub = id del usuario). */
export const createTestToken = (payload: { userId: string; email: string; role: Role }) =>
  generarToken({ id: payload.userId, email: payload.email, role: payload.role });

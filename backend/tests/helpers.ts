import jwt from 'jsonwebtoken';
import { ENV } from '../src/config/env';
import { Role } from '@prisma/client';

export const createTestToken = (payload: { userId: string; email: string; role: Role }) => {
  return jwt.sign(payload, ENV.JWT_SECRET, { expiresIn: '1h' });
};

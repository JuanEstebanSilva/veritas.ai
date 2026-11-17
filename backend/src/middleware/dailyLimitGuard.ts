import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { prisma } from '../config/prisma';

export const FREE_DAILY_LIMIT = 5;

/**
 * Comprueba si dos fechas corresponden al mismo día del calendario local
 */
export const isSameCalendarDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const checkDailyAnalysisLimit = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const user = req.user;

  if (!user) {
    res.status(401).json({
      success: false,
      message: 'Debes iniciar sesión para utilizar el analizador.',
    });
    return;
  }

  // En esta versión Open Source de Plagelio / Veritas.ai, todos los usuarios tienen análisis ilimitados y gratuitos.
  next();
  return;
};

/**
 * Incrementa el contador de análisis diarios solo cuando la operación se completó con éxito
 */
export const recordSuccessfulAnalysis = async (userId: string): Promise<number> => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return 0;

  const now = new Date();
  const lastDate = new Date(user.last_analysis_date);

  const newCount = isSameCalendarDay(now, lastDate) ? user.daily_analysis_count + 1 : 1;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      daily_analysis_count: newCount,
      last_analysis_date: now,
    },
  });

  return updated.daily_analysis_count;
};

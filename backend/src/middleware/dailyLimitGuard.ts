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

  // Los usuarios Premium disfrutan de análisis ilimitados
  if (user.is_premium) {
    next();
    return;
  }

  const now = new Date();
  const lastDate = new Date(user.last_analysis_date);

  let currentDailyCount = user.daily_analysis_count;

  // Si comenzó un nuevo día, reiniciar contador en base de datos
  if (!isSameCalendarDay(now, lastDate)) {
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        daily_analysis_count: 0,
        last_analysis_date: now,
      },
    });
    req.user = updatedUser;
    currentDailyCount = 0;
  }

  // Verificar si ya alcanzó el límite de 5 análisis
  if (currentDailyCount >= FREE_DAILY_LIMIT) {
    res.status(429).json({
      success: false,
      isLimitReached: true,
      limit: FREE_DAILY_LIMIT,
      usedToday: currentDailyCount,
      message: 'Has alcanzado tus 5 análisis gratuitos de hoy. Obtén Premium para disfrutar de análisis ilimitados.',
    });
    return;
  }

  next();
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

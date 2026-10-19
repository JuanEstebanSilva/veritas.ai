import { Response, NextFunction, RequestHandler } from 'express';
import { Role, User } from '@prisma/client';
import { AuthenticatedRequest } from './authMiddleware';
import { prisma } from '../config/prisma';
import { esEstudianteAsignado } from '../services/teacherStudents.service';

/**
 * Autorización a nivel de objeto — Lab 10 (BOLA / IDOR).
 *
 * RBAC responde «¿tu rol puede consultar análisis?». Estos middlewares responden
 * la pregunta que faltaba: «¿puedes hacerlo sobre ESTE análisis / ESTE estudiante?».
 * Cambiar un identificador en la URL no da acceso a recursos ajenos.
 *
 *   ADMIN    → todos los recursos
 *   DOCENTE  → solo lo de los estudiantes que el administrador le asignó (lectura)
 *   USER     → solo lo suyo
 *
 * Van siempre después de authenticateJWT, authorizeRoles y validateUuidParam:
 * se compara la propiedad sobre un identificador que ya se sabe bien formado.
 */

const prohibir = (res: Response, message: string): void => {
  res.status(403).json({ success: false, message, mensaje: 'No tiene permisos para acceder a este recurso' });
};

const noAutenticado = (res: Response): void => {
  res.status(401).json({ success: false, message: 'Autenticación requerida.', mensaje: 'Usuario no autenticado' });
};

/** Escribir (borrar, re-analizar, humanizar) un análisis: solo su dueño o el administrador. */
export const puedeModificarAnalisis = (user: Pick<User, 'id' | 'role'>, analysis: { user_id: string }): boolean =>
  user.role === Role.ADMIN || analysis.user_id === user.id;

/**
 * GET /api/analyses/student/:studentId
 * El estudiante solo pide lo suyo; el docente, solo a sus estudiantes asignados.
 */
export const authorizeStudentAccess = (param = 'studentId'): RequestHandler => {
  const handler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) return noAutenticado(res);
      const studentId = req.params[param] as string;

      if (user.role === Role.ADMIN) return next();
      if (user.role === Role.USER && studentId === user.id) return next();
      if (user.role === Role.DOCENTE && (await esEstudianteAsignado(user.id, studentId))) return next();

      prohibir(res, 'Acceso no autorizado: no puedes consultar los análisis de otro estudiante.');
    } catch (error) {
      next(error);
    }
  };
  return handler as RequestHandler;
};

/**
 * GET /api/analyses/teacher/:teacherId · GET /api/teachers/:teacherId/students
 * Un docente solo consulta su propio grupo; el administrador, cualquiera.
 */
export const authorizeTeacherAccess = (param = 'teacherId'): RequestHandler => {
  const handler = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    if (!user) return noAutenticado(res);
    const teacherId = req.params[param] as string;

    if (user.role === Role.ADMIN) return next();
    if (user.role === Role.DOCENTE && teacherId === user.id) return next();

    prohibir(res, 'Acceso no autorizado: no puedes consultar el grupo de otro docente.');
  };
  return handler as RequestHandler;
};

// Los mismos textos que ya mostraba la web antes del Lab 10
const MENSAJE_AJENO: Record<string, string> = {
  GET: 'Acceso no autorizado: No tienes permiso para ver este análisis.',
  DELETE: 'Acceso no autorizado: No puedes eliminar análisis de otros usuarios.',
  POST: 'Acceso no autorizado: No puedes modificar análisis de otros usuarios.',
};
const MENSAJE_DOCENTE_SOLO_LECTURA =
  'Acceso no autorizado: el docente puede revisar el análisis de su estudiante, pero solo su autor o el administrador pueden modificarlo.';

/**
 * /api/analyses/:id — carga el análisis y comprueba la propiedad antes del controlador.
 *   404 si no existe · 403 si existe pero no te corresponde.
 * `docentePuedeLeer`: el docente asignado puede LEER el análisis de su estudiante,
 * pero nunca borrarlo ni modificarlo (acción ≠ propiedad).
 */
export const authorizeAnalysisAccess = ({ docentePuedeLeer }: { docentePuedeLeer: boolean }): RequestHandler => {
  const handler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = req.user;
      if (!user) return noAutenticado(res);

      const analysis = await prisma.analysis.findUnique({
        where: { id: req.params.id as string },
        select: { id: true, user_id: true },
      });
      if (!analysis) {
        res.status(404).json({ success: false, message: 'Análisis no encontrado.', mensaje: 'Recurso no encontrado' });
        return;
      }

      if (puedeModificarAnalisis(user, analysis)) return next();

      const docenteAsignado = user.role === Role.DOCENTE && (await esEstudianteAsignado(user.id, analysis.user_id));
      if (docenteAsignado && docentePuedeLeer) return next();

      prohibir(res, docenteAsignado ? MENSAJE_DOCENTE_SOLO_LECTURA : MENSAJE_AJENO[req.method] ?? MENSAJE_AJENO.POST);
    } catch (error) {
      next(error);
    }
  };
  return handler as RequestHandler;
};

import { Response } from 'express';
import { Role } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { prisma } from '../config/prisma';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const responder = (res: Response, status: number, message: string, extra: Record<string, unknown> = {}): void => {
  res.status(status).json({ success: status < 400, message, ...extra });
};

/**
 * Asignaciones docente ↔ estudiante — Lab 10.
 *
 * Validar el FORMATO (¿es un UUID?) no basta: también hay reglas de negocio
 * (¿existe ese usuario?, ¿tiene el rol correcto?, ¿ya estaba asignado?).
 * Del cuerpo solo se lee studentId (lista blanca); id, fechas o roles enviados se ignoran.
 */
export class TeacherController {
  /** GET /api/teachers/:teacherId/students — el docente (su propio grupo) o el administrador. */
  public static async listStudents(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teacherId = req.params.teacherId as string;
      const docente = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } });
      if (!docente || docente.role !== Role.DOCENTE) {
        responder(res, 404, 'Docente no encontrado.');
        return;
      }
      const asignaciones = await prisma.teacherStudent.findMany({
        where: { teacher_id: teacherId },
        orderBy: { created_at: 'asc' },
        select: {
          created_at: true,
          student: { select: { id: true, name: true, last_name: true, email: true, is_active: true } },
        },
      });
      res.status(200).json({
        success: true,
        total: asignaciones.length,
        students: asignaciones.map((a) => ({ ...a.student, assigned_at: a.created_at })),
      });
    } catch (error: any) {
      responder(res, 500, 'Error al consultar los estudiantes del docente.');
    }
  }

  /** POST /api/teachers/:teacherId/students — solo el administrador. */
  public static async assignStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teacherId = req.params.teacherId as string;
      const { studentId } = req.body ?? {};

      if (typeof studentId !== 'string' || !UUID_V4.test(studentId)) {
        responder(res, 400, "El campo 'studentId' es obligatorio y debe ser un UUID válido.");
        return;
      }

      const docente = await prisma.user.findUnique({ where: { id: teacherId }, select: { role: true } });
      if (!docente) {
        responder(res, 404, 'Docente no encontrado.');
        return;
      }
      if (docente.role !== Role.DOCENTE) {
        responder(res, 409, 'El usuario indicado en la ruta no tiene rol DOCENTE.');
        return;
      }

      const estudiante = await prisma.user.findUnique({ where: { id: studentId }, select: { role: true } });
      if (!estudiante) {
        responder(res, 400, 'El estudiante asociado no existe.');
        return;
      }
      if (estudiante.role !== Role.USER) {
        responder(res, 409, 'El usuario asociado no tiene rol de estudiante (USER).');
        return;
      }

      const existente = await prisma.teacherStudent.findUnique({
        where: { teacher_id_student_id: { teacher_id: teacherId, student_id: studentId } },
      });
      if (existente) {
        responder(res, 409, 'El estudiante ya está asignado a este docente.');
        return;
      }

      const asignacion = await prisma.teacherStudent.create({
        data: { teacher_id: teacherId, student_id: studentId },
        select: { id: true, teacher_id: true, student_id: true, created_at: true },
      });
      responder(res, 201, 'Estudiante asignado al docente.', { assignment: asignacion });
    } catch (error: any) {
      // Red de seguridad: dos asignaciones simultáneas chocan con el UNIQUE de la BD.
      if (error?.code === 'P2002') {
        responder(res, 409, 'El estudiante ya está asignado a este docente.');
        return;
      }
      responder(res, 500, 'Error al asignar el estudiante.');
    }
  }

  /** DELETE /api/teachers/:teacherId/students/:studentId — solo el administrador. */
  public static async unassignStudent(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const teacherId = req.params.teacherId as string;
      const studentId = req.params.studentId as string;
      const { count } = await prisma.teacherStudent.deleteMany({ where: { teacher_id: teacherId, student_id: studentId } });
      if (count === 0) {
        responder(res, 404, 'Ese estudiante no está asignado a este docente.');
        return;
      }
      responder(res, 200, 'Asignación eliminada. El docente deja de ver los análisis de ese estudiante.');
    } catch (error: any) {
      responder(res, 500, 'Error al eliminar la asignación.');
    }
  }
}

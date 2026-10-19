import { prisma } from '../config/prisma';

/**
 * Asignaciones docente ↔ estudiante (Lab 10).
 *
 * Es el equivalente de «usuarioId ↔ médico» en la API del Hospital: sin esta
 * relación explícita no hay forma de responder si un análisis le corresponde a
 * un docente. Nunca se deduce de ids parecidos ni de datos que envíe el cliente.
 */
export const esEstudianteAsignado = async (teacherId: string, studentId: string): Promise<boolean> => {
  const asignacion = await prisma.teacherStudent.findUnique({
    where: { teacher_id_student_id: { teacher_id: teacherId, student_id: studentId } },
    select: { id: true },
  });
  return asignacion !== null;
};

export const idsEstudiantesAsignados = async (teacherId: string): Promise<string[]> => {
  const asignaciones = await prisma.teacherStudent.findMany({
    where: { teacher_id: teacherId },
    select: { student_id: true },
  });
  return asignaciones.map((a) => a.student_id);
};

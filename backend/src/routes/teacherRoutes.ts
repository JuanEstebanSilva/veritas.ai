import { Router } from 'express';
import { Role } from '@prisma/client';
import { TeacherController } from '../controllers/TeacherController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { authorizeRoles } from '../middleware/roleGuard';
import { authorizeTeacherAccess } from '../middleware/ownershipMiddleware';
import { validateUuidParam } from '../middleware/validateUuidParam';

/**
 * Lab 10 · grupos docente ↔ estudiante.
 * Asignar y retirar es administrativo; consultar el grupo, también el propio docente.
 */
const router = Router();

router.use(authenticateJWT);

router.get(
  '/:teacherId/students',
  authorizeRoles(Role.ADMIN, Role.DOCENTE),
  validateUuidParam('teacherId'),
  authorizeTeacherAccess('teacherId'),
  TeacherController.listStudents
);

router.post('/:teacherId/students', authorizeRoles(Role.ADMIN), validateUuidParam('teacherId'), TeacherController.assignStudent);

router.delete(
  '/:teacherId/students/:studentId',
  authorizeRoles(Role.ADMIN),
  validateUuidParam('teacherId'),
  validateUuidParam('studentId'),
  TeacherController.unassignStudent
);

export default router;

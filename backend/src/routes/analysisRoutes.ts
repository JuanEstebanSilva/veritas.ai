import { Router } from 'express';
import { AnalysisController } from '../controllers/AnalysisController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { checkDailyAnalysisLimit } from '../middleware/dailyLimitGuard';
import { uploadDocument } from '../middleware/uploadMiddleware';
import { validateUuidParam } from '../middleware/validateUuidParam';
import { authorizeRoles } from '../middleware/roleGuard';
import { authorizeAnalysisAccess, authorizeStudentAccess, authorizeTeacherAccess } from '../middleware/ownershipMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Todas las rutas de análisis requieren usuario autenticado
router.use(authenticateJWT);

// Rutas de ejecución de análisis sujetas a control de límite de 5 análisis diarios para usuarios gratuitos
router.post('/text', checkDailyAnalysisLimit, AnalysisController.analyzeText);
router.post('/document', checkDailyAnalysisLimit, uploadDocument.single('file'), AnalysisController.analyzeDocument);
router.post('/docx', checkDailyAnalysisLimit, uploadDocument.single('file'), AnalysisController.analyzeDocument);
router.post('/pdf', checkDailyAnalysisLimit, uploadDocument.single('file'), AnalysisController.analyzeDocument);

// Historial propio (cualquier rol autenticado; la web lo usa así desde el Lab 5)
router.get('/history', AnalysisController.getHistory);

// ── Lab 10 · autenticar → autorizar rol (RBAC) → validar id → autorizar objeto (BOLA) → controlador ──
const TODOS = [Role.ADMIN, Role.DOCENTE, Role.USER];

// Vista global: solo el administrador
router.get('/', authorizeRoles(Role.ADMIN), AnalysisController.listAll);

// «Mis análisis»: la identidad sale del JWT, sin ids en la URL
router.get('/mine', authorizeRoles(Role.USER, Role.DOCENTE), AnalysisController.getMine);

// Por estudiante: él mismo, su docente asignado o el administrador
router.get(
  '/student/:studentId',
  authorizeRoles(...TODOS),
  validateUuidParam('studentId'),
  authorizeStudentAccess('studentId'),
  AnalysisController.getByStudent
);

// Por docente: el propio docente o el administrador
router.get(
  '/teacher/:teacherId',
  authorizeRoles(Role.ADMIN, Role.DOCENTE),
  validateUuidParam('teacherId'),
  authorizeTeacherAccess('teacherId'),
  AnalysisController.getByTeacher
);

// Un análisis concreto: leerlo (autor, docente asignado, admin) ≠ modificarlo (autor, admin)
router.get('/:id', authorizeRoles(...TODOS), validateUuidParam('id'), authorizeAnalysisAccess({ docentePuedeLeer: true }), AnalysisController.getAnalysisById);
router.delete('/:id', authorizeRoles(...TODOS), validateUuidParam('id'), authorizeAnalysisAccess({ docentePuedeLeer: false }), AnalysisController.deleteAnalysis);
router.post(
  '/:id/reanalyze-improved',
  authorizeRoles(...TODOS),
  validateUuidParam('id'),
  authorizeAnalysisAccess({ docentePuedeLeer: false }),
  AnalysisController.reanalyzeImproved
);

export default router;

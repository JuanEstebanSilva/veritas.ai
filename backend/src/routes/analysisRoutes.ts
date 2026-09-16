import { Router } from 'express';
import { AnalysisController } from '../controllers/AnalysisController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { checkDailyAnalysisLimit } from '../middleware/dailyLimitGuard';
import { uploadDocument } from '../middleware/uploadMiddleware';

const router = Router();

// Todas las rutas de análisis requieren usuario autenticado
router.use(authenticateJWT);

// Rutas de ejecución de análisis sujetas a control de límite de 5 análisis diarios para usuarios gratuitos
router.post('/text', checkDailyAnalysisLimit, AnalysisController.analyzeText);
router.post('/document', checkDailyAnalysisLimit, uploadDocument.single('file'), AnalysisController.analyzeDocument);
router.post('/docx', checkDailyAnalysisLimit, uploadDocument.single('file'), AnalysisController.analyzeDocument);

// Historial y detalle
router.get('/history', AnalysisController.getHistory);
router.get('/:id', AnalysisController.getAnalysisById);
router.delete('/:id', AnalysisController.deleteAnalysis);
router.post('/:id/reanalyze-improved', AnalysisController.reanalyzeImproved);

export default router;

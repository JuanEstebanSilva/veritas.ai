import { Router } from 'express';
import { WritingController } from '../controllers/WritingController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.use(authenticateJWT);

router.post('/improve', WritingController.improveText);
router.post('/download-docx', WritingController.downloadDocx);
router.post('/download-txt', WritingController.downloadTxt);

export default router;

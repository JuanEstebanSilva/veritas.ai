import { Router } from 'express';
import { WritingController } from '../controllers/WritingController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { uploadDocument } from '../middleware/uploadMiddleware';

const router = Router();

router.use(authenticateJWT);

router.post('/improve', WritingController.improveText);
router.post('/improve-document', uploadDocument.single('file'), WritingController.improveDocument);
router.post('/extract-text', uploadDocument.single('file'), WritingController.extractTextFromDocument);
router.post('/download-docx', WritingController.downloadDocx);
router.post('/download-txt', WritingController.downloadTxt);

export default router;


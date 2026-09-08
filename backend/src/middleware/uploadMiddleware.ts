import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Almacenamiento en memoria para procesamiento directo sin escritura innecesaria a disco
const storage = multer.memoryStorage();

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const validMimes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/octet-stream',
  ];

  if (ext === '.docx' && (validMimes.includes(file.mimetype) || file.mimetype.includes('word'))) {
    cb(null, true);
  } else {
    cb(new Error('Formato inválido. Únicamente se permite cargar documentos con extensión .docx'));
  }
};

export const uploadDocx = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB máximo
  },
  fileFilter,
});

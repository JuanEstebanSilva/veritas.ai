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
    'application/pdf',
  ];

  const isDocx = ext === '.docx' && (validMimes.includes(file.mimetype) || file.mimetype.includes('word'));
  const isPdf = ext === '.pdf' && (validMimes.includes(file.mimetype) || file.mimetype.includes('pdf'));

  if (isDocx || isPdf) {
    cb(null, true);
  } else {
    cb(new Error('Formato inválido. Solo se admiten documentos en formato .docx o .pdf'));
  }
};

export const uploadDocument = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB máximo
  },
  fileFilter,
});

export const uploadDocx = uploadDocument;

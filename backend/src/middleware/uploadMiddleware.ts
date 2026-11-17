import multer from 'multer';
import path from 'path';
import { Request } from 'express';

// Almacenamiento en memoria para procesamiento directo sin escritura innecesaria a disco
const storage = multer.memoryStorage();

const ALLOWED_EXTENSIONS = new Set([
  '.docx',
  '.doc',
  '.pdf',
  '.odt',
  '.rtf',
  '.txt',
  '.text',
  '.md',
  '.markdown',
  '.csv',
  '.tsv',
  '.html',
  '.htm',
]);

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Formato inválido. Se admiten documentos .docx, .doc, .pdf, .odt, .rtf, .txt, .md, .csv y .html'
      )
    );
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

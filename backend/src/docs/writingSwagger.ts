// writingSwagger.ts - Documentación OpenAPI para el Asistente de Redacción
/**
 * @swagger
 * tags:
 *   name: Writing
 *   description: Asistente inteligente de mejora de redacción y procesamiento de documentos
 */

/**
 * @swagger
 * /api/writing/improve:
 *   post:
 *     summary: Mejorar estilo y redacción de texto
 *     description: Analiza y reescribe texto para reducir patrones repetitivos y mejorar la calidad académica/profesional.
 *     tags: [Writing]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *                 description: Texto a mejorar
 *                 example: Este es un texto con redacción básica que requiere mejoras en estilo y fluidez.
 *     responses:
 *       200:
 *         description: Texto mejorado exitosamente.
 *       400:
 *         description: Texto insuficiente.
 *       401:
 *         description: No autenticado (requiere API Key y Token JWT).
 */

/**
 * @swagger
 * /api/writing/improve-document:
 *   post:
 *     summary: Mejorar redacción a partir de un archivo DOCX o PDF
 *     tags: [Writing]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Documento DOCX o PDF
 *     responses:
 *       200:
 *         description: Documento procesado y texto reescrito.
 *       400:
 *         description: Archivo inválido o vacío.
 *       401:
 *         description: No autenticado.
 */

/**
 * @swagger
 * /api/writing/extract-text:
 *   post:
 *     summary: Extraer texto plano desde un documento subido
 *     tags: [Writing]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Texto extraído exitosamente.
 *       400:
 *         description: Archivo ausente o no procesable.
 *       401:
 *         description: No autenticado.
 */

/**
 * @swagger
 * /api/writing/download-docx:
 *   post:
 *     summary: Descargar documento generado en formato .docx
 *     tags: [Writing]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Archivo DOCX binario descargable.
 *         content:
 *           application/vnd.openxmlformats-officedocument.wordprocessingml.document:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: No autenticado.
 */

/**
 * @swagger
 * /api/writing/download-txt:
 *   post:
 *     summary: Descargar texto generado en formato .txt
 *     tags: [Writing]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *             properties:
 *               text:
 *                 type: string
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Archivo de texto plano descargable.
 *       401:
 *         description: No autenticado.
 */

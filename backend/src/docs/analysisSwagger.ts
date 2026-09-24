// analysisSwagger.ts - Swagger JSDoc annotations for Analysis CRUD endpoints

/**
 * @swagger
 * tags:
 *   name: Analyses
 *   description: Operaciones de análisis de texto y documentos
 */

/**
 * @swagger
 * /api/analyses/text:
 *   post:
 *     summary: Analizar texto enviado en el cuerpo
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Texto a analizar (mínimo 15 caracteres)
 *               title:
 *                 type: string
 *                 description: Título opcional del análisis
 *     responses:
 *       201:
 *         description: Análisis creado exitosamente
 *       400:
 *         description: Validación fallida
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/analyses/document:
 *   post:
 *     summary: Analizar documento subido (docx o pdf)
 *     tags: [Analyses]
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
 *                 description: Archivo .docx o .pdf
 *     responses:
 *       201:
 *         description: Documento analizado y guardado
 *       400:
 *         description: Archivo ausente o contenido insuficiente
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/analyses/docx:
 *   post:
 *     summary: Alias para análisis de documento (compatibilidad)
 *     tags: [Analyses]
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
 *       201:
 *         description: Documento analizado y guardado
 */

/**
 * @swagger
 * /api/analyses/history:
 *   get:
 *     summary: Obtener historial de análisis del usuario autenticado
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de análisis
 *       500:
 *         description: Error interno
 */

/**
 * @swagger
 * /api/analyses/{id}:
 *   get:
 *     summary: Obtener detalle de un análisis por ID
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del análisis
 *     responses:
 *       200:
 *         description: Detalle del análisis
 *       404:
 *         description: Análisis no encontrado
 */

/**
 * @swagger
 * /api/analyses/{id}:
 *   delete:
 *     summary: Eliminar un análisis del historial
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID del análisis a eliminar
 *     responses:
 *       200:
 *         description: Análisis eliminado
 *       403:
 *         description: No autorizado
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/analyses/{id}/reanalyze-improved:
 *   post:
 *     summary: Re‑analizar la versión mejorada de un documento
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Comparación de resultados
 *       400:
 *         description: Versión mejorada no disponible
 *       403:
 *         description: No autorizado
 *       404:
 *         description: Análisis no encontrado
 */

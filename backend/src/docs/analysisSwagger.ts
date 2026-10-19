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
 * components:
 *   responses:
 *     NoAutenticado:
 *       description: 401 — falta la API Key o el JWT, o el token es inválido, alterado o expirado
 *     SinPermisoRol:
 *       description: 403 — sabemos quién eres, pero tu rol no puede realizar esta operación (RBAC)
 *     SinPermisoObjeto:
 *       description: 403 — tu rol puede usar la operación, pero no sobre ESTE recurso (BOLA/IDOR)
 *   parameters:
 *     AnalysisId:
 *       in: path
 *       name: id
 *       required: true
 *       schema: { type: string, format: uuid }
 *       description: UUID del análisis
 */

/**
 * @swagger
 * /api/analyses/history:
 *   get:
 *     summary: Historial propio del usuario autenticado
 *     description: Devuelve solo los análisis creados por la persona del JWT (cualquier rol).
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de análisis propios
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 */

/**
 * @swagger
 * /api/analyses:
 *   get:
 *     summary: Todos los análisis del sistema (solo ADMIN)
 *     description: Vista global para el administrador. Un estudiante o un docente reciben 403, así no hay exposición masiva de análisis ajenos.
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de análisis con su autor
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *       403:
 *         $ref: '#/components/responses/SinPermisoRol'
 */

/**
 * @swagger
 * /api/analyses/mine:
 *   get:
 *     summary: Mis análisis según la identidad del JWT (USER y DOCENTE)
 *     description: |
 *       No recibe ningún identificador: el servidor lo deriva del JWT, así que no hay nada que manipular en la URL.
 *       USER → sus propios análisis. DOCENTE → los análisis de los estudiantes que tiene asignados (403 si no tiene ninguno).
 *       ADMIN → 403: para la vista global usa GET /api/analyses.
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Análisis que le corresponden al usuario autenticado
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *       403:
 *         description: Rol ADMIN, o docente sin estudiantes asignados
 */

/**
 * @swagger
 * /api/analyses/student/{studentId}:
 *   get:
 *     summary: Análisis de un estudiante
 *     description: El propio estudiante, un docente que lo tenga asignado o el administrador. Cambiar el studentId por el de otra persona responde 403.
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Análisis del estudiante
 *       400:
 *         description: studentId no es un UUID válido
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *       403:
 *         $ref: '#/components/responses/SinPermisoObjeto'
 *       404:
 *         description: El estudiante no existe (solo lo ve el administrador)
 */

/**
 * @swagger
 * /api/analyses/teacher/{teacherId}:
 *   get:
 *     summary: Análisis de los estudiantes de un docente
 *     description: El propio docente o el administrador. Un estudiante recibe 403 por su rol; un docente que pide el grupo de otro docente, 403 por propiedad.
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Análisis de los estudiantes asignados
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *       403:
 *         description: Rol no permitido o grupo de otro docente
 *       404:
 *         description: El docente no existe
 */

/**
 * @swagger
 * /api/analyses/{id}:
 *   get:
 *     summary: Detalle de un análisis
 *     description: Lo pueden leer su autor, el docente que tenga asignado a ese estudiante y el administrador.
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AnalysisId'
 *     responses:
 *       200:
 *         description: Detalle del análisis
 *       400:
 *         description: El id no es un UUID válido
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *       403:
 *         $ref: '#/components/responses/SinPermisoObjeto'
 *       404:
 *         description: Análisis no encontrado
 *   delete:
 *     summary: Eliminar un análisis
 *     description: Solo su autor o el administrador. El docente asignado puede leerlo, pero no borrarlo (acción ≠ propiedad).
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AnalysisId'
 *     responses:
 *       200:
 *         description: Análisis eliminado
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *       403:
 *         $ref: '#/components/responses/SinPermisoObjeto'
 *       404:
 *         description: No encontrado
 */

/**
 * @swagger
 * /api/analyses/{id}/reanalyze-improved:
 *   post:
 *     summary: Re‑analizar la versión mejorada de un documento
 *     description: Solo su autor o el administrador.
 *     tags: [Analyses]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/AnalysisId'
 *     responses:
 *       200:
 *         description: Comparación de resultados
 *       400:
 *         description: Versión mejorada no disponible
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *       403:
 *         $ref: '#/components/responses/SinPermisoObjeto'
 *       404:
 *         description: Análisis no encontrado
 */

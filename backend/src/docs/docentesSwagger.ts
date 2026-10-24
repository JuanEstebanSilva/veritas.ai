/**
 * @swagger
 * tags:
 *   - name: Docentes y Auditores
 *     description: Gestión de profesores auditores de ética e integridad académica (Bloque C / Médicos)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DocenteEntrada:
 *       type: object
 *       required:
 *         - nombre
 *         - registroAcademico
 *         - email
 *         - telefono
 *         - departamentoId
 *       properties:
 *         nombre:
 *           type: string
 *           example: Dr. Carlos Ruiz
 *         registroAcademico:
 *           type: string
 *           example: DOC-7788
 *         email:
 *           type: string
 *           format: email
 *           example: carlos.ruiz@veritas.ai
 *         telefono:
 *           type: string
 *           example: "3101112233"
 *         departamentoId:
 *           type: integer
 *           example: 1
 *         activo:
 *           type: boolean
 *           example: true
 *     DocenteSalida:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: Dr. Carlos Ruiz
 *         registroAcademico:
 *           type: string
 *           example: DOC-7788
 *         email:
 *           type: string
 *           example: carlos.ruiz@veritas.ai
 *         telefono:
 *           type: string
 *           example: "3101112233"
 *         departamentoId:
 *           type: integer
 *           example: 1
 *         activo:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/docentes:
 *   get:
 *     tags:
 *       - Docentes y Auditores
 *     summary: Listar Docentes y Auditores
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de docentes obtenida exitosamente
 *   post:
 *     tags:
 *       - Docentes y Auditores
 *     summary: 9 & 10. Crear Docente Auditor (201 Created / 409 Conflict)
 *     description: >
 *       Permite registrar un docente auditor en la base de datos.
 *       Si se envía un registroAcademico o email duplicado, responde 409 Conflict.
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocenteEntrada'
 *     responses:
 *       201:
 *         description: Docente auditor registrado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Requiere rol de administrador
 *       409:
 *         description: Registro académico o correo ya registrado en el sistema
 */

/**
 * @swagger
 * /api/docentes/{id}:
 *   get:
 *     tags:
 *       - Docentes y Auditores
 *     summary: Consultar Docente por ID
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Docente encontrado
 *       404:
 *         description: Docente no encontrado
 *   put:
 *     tags:
 *       - Docentes y Auditores
 *     summary: Actualizar Docente
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DocenteEntrada'
 *     responses:
 *       200:
 *         description: Docente actualizado
 *       404:
 *         description: Docente no encontrado
 *   delete:
 *     tags:
 *       - Docentes y Auditores
 *     summary: Eliminar Docente
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         example: 1
 *     responses:
 *       200:
 *         description: Docente eliminado
 *       409:
 *         description: Conflicto de integridad referencial (tiene revisiones asignadas)
 */

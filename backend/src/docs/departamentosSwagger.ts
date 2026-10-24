/**
 * @swagger
 * tags:
 *   - name: Departamentos Académicos
 *     description: Gestión de facultades y departamentos de Veritas AI (Bloque B / Especialidades)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     DepartamentoEntrada:
 *       type: object
 *       required:
 *         - nombre
 *         - descripcion
 *       properties:
 *         nombre:
 *           type: string
 *           example: Inteligencia Artificial y Ética Computacional
 *         descripcion:
 *           type: string
 *           example: Investigación en integridad académica, modelos LLM y PLN
 *         activa:
 *           type: boolean
 *           example: true
 *     DepartamentoSalida:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         nombre:
 *           type: string
 *           example: Inteligencia Artificial y Ética Computacional
 *         descripcion:
 *           type: string
 *           example: Investigación en integridad académica, modelos LLM y PLN
 *         activa:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/departamentos:
 *   get:
 *     tags:
 *       - Departamentos Académicos
 *     summary: 5. Listar Departamentos Académicos (200 OK)
 *     description: Retorna la lista completa de departamentos académicos registrados en el sistema.
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de departamentos académicos obtenida exitosamente
 *       401:
 *         description: Token JWT o API Key no suministrados o inválidos
 *   post:
 *     tags:
 *       - Departamentos Académicos
 *     summary: 6 & 7. Crear Departamento Académico (201 Created / 409 Conflict / 403 RBAC)
 *     description: >
 *       Permite a un administrador registrar un nuevo departamento académico.
 *       Si se intenta registrar un nombre duplicado (incluso en minúsculas), responde 409 Conflict.
 *       Si se consume con token de estudiante, responde 403 Forbidden por RBAC.
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DepartamentoEntrada'
 *     responses:
 *       201:
 *         description: Departamento académico creado exitosamente
 *       400:
 *         description: Datos inválidos en la petición
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Permisos insuficientes (requiere rol administrador)
 *       409:
 *         description: Ya existe un departamento con ese nombre
 */

/**
 * @swagger
 * /api/departamentos/{id}:
 *   get:
 *     tags:
 *       - Departamentos Académicos
 *     summary: Consultar Departamento Académico por ID
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
 *         description: Departamento encontrado
 *       404:
 *         description: Departamento no encontrado
 *   put:
 *     tags:
 *       - Departamentos Académicos
 *     summary: Actualizar Departamento Académico
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
 *             $ref: '#/components/schemas/DepartamentoEntrada'
 *     responses:
 *       200:
 *         description: Departamento actualizado
 *       404:
 *         description: Departamento no encontrado
 *   delete:
 *     tags:
 *       - Departamentos Académicos
 *     summary: Eliminar Departamento Académico
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
 *         description: Departamento eliminado correctamente
 *       404:
 *         description: Departamento no encontrado
 *       409:
 *         description: Conflicto de integridad referencial (tiene docentes asociados)
 */

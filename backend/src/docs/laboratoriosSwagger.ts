/**
 * @swagger
 * tags:
 *   - name: Laboratorios de Cómputo
 *     description: Infraestructura de cómputo y auditoría ética de Veritas AI (Bloque D / Consultorios)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LaboratorioEntrada:
 *       type: object
 *       required:
 *         - codigo
 *         - nombre
 *       properties:
 *         codigo:
 *           type: string
 *           example: LAB-301
 *         nombre:
 *           type: string
 *           example: Laboratorio de PLN y Cómputo Ético
 *         piso:
 *           type: integer
 *           example: 3
 *         ubicacion:
 *           type: string
 *           example: Edificio de Ingeniería - Cómputo Avanzado
 *         activo:
 *           type: boolean
 *           example: true
 *     LaboratorioSalida:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         codigo:
 *           type: string
 *           example: LAB-301
 *         nombre:
 *           type: string
 *           example: Laboratorio de PLN y Cómputo Ético
 *         piso:
 *           type: integer
 *           example: 3
 *         activo:
 *           type: boolean
 *           example: true
 */

/**
 * @swagger
 * /api/laboratorios:
 *   get:
 *     tags:
 *       - Laboratorios de Cómputo
 *     summary: Listar Laboratorios de Cómputo
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de laboratorios obtenida exitosamente
 *   post:
 *     tags:
 *       - Laboratorios de Cómputo
 *     summary: 13. Crear Laboratorio de Cómputo (201 Created / 409 Conflict)
 *     description: >
 *       Permite a un administrador registrar un nuevo laboratorio de cómputo para auditorías.
 *       Si el código del laboratorio ya existe, responde 409 Conflict.
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LaboratorioEntrada'
 *     responses:
 *       201:
 *         description: Laboratorio registrado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Requiere rol de administrador
 *       409:
 *         description: Ya existe un laboratorio con ese código o número
 */

/**
 * @swagger
 * /api/laboratorios/{id}:
 *   get:
 *     tags:
 *       - Laboratorios de Cómputo
 *     summary: Consultar Laboratorio por ID
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
 *         description: Laboratorio encontrado
 *       404:
 *         description: Laboratorio no encontrado
 */

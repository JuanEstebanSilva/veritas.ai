/**
 * @swagger
 * tags:
 *   - name: Estudiantes y Autores
 *     description: Gestión de perfiles de estudiantes y autores académicos (Bloque D / Pacientes)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     EstudianteEntrada:
 *       type: object
 *       required:
 *         - nombre
 *         - documento
 *         - email
 *         - telefono
 *         - fechaNacimiento
 *       properties:
 *         nombre:
 *           type: string
 *           example: Laura Méndez
 *         documento:
 *           type: string
 *           example: "1045678901"
 *         email:
 *           type: string
 *           format: email
 *           example: laura@veritas.ai
 *         telefono:
 *           type: string
 *           example: "3123456789"
 *         fechaNacimiento:
 *           type: string
 *           format: date
 *           example: "1998-05-12"
 *     EstudianteSalida:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         usuarioId:
 *           type: string
 *           nullable: true
 *           example: "uuid-12345"
 *         nombre:
 *           type: string
 *           example: Laura Méndez
 *         documento:
 *           type: string
 *           example: "1045678901"
 *         email:
 *           type: string
 *           example: laura@veritas.ai
 *         telefono:
 *           type: string
 *           example: "3123456789"
 *         fechaNacimiento:
 *           type: string
 *           example: "1998-05-12"
 */

/**
 * @swagger
 * /api/estudiantes:
 *   get:
 *     tags:
 *       - Estudiantes y Autores
 *     summary: Listar Estudiantes Autores
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de estudiantes obtenida exitosamente
 *   post:
 *     tags:
 *       - Estudiantes y Autores
 *     summary: 11 & 12. Registrar Estudiante Autor (201 Created / 409 Conflict)
 *     description: >
 *       Permite a un administrador registrar formalmente a un estudiante autor en la base de datos.
 *       Si se intenta registrar un documento de identidad duplicado, responde 409 Conflict.
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EstudianteEntrada'
 *     responses:
 *       201:
 *         description: Estudiante registrado exitosamente
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Requiere rol de administrador
 *       409:
 *         description: Ya existe un estudiante con ese documento de identidad o correo
 */

/**
 * @swagger
 * /api/estudiantes/{id}:
 *   get:
 *     tags:
 *       - Estudiantes y Autores
 *     summary: Consultar Estudiante por ID
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
 *         description: Estudiante encontrado
 *       404:
 *         description: Estudiante no encontrado
 *   put:
 *     tags:
 *       - Estudiantes y Autores
 *     summary: Actualizar Estudiante
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
 *             $ref: '#/components/schemas/EstudianteEntrada'
 *     responses:
 *       200:
 *         description: Estudiante actualizado
 *       404:
 *         description: Estudiante no encontrado
 *   delete:
 *     tags:
 *       - Estudiantes y Autores
 *     summary: 20. Eliminar Estudiante (409 Conflict si tiene revisiones activas)
 *     description: >
 *       Verifica la Integridad Referencial. Si el estudiante tiene auditorías o revisiones asociadas,
 *       el sistema bloquea la eliminación arrojando 409 Conflict.
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
 *         description: Estudiante eliminado
 *       404:
 *         description: Estudiante no encontrado
 *       409:
 *         description: Conflicto de integridad referencial (el estudiante tiene revisiones activas)
 */

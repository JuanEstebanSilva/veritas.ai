// teacherSwagger.ts - Lab 10: grupos docente ↔ estudiante

/**
 * @swagger
 * tags:
 *   name: Teachers
 *   description: Grupos docente ↔ estudiante (Lab 10). Un docente solo ve los análisis de sus estudiantes asignados.
 */

/**
 * @swagger
 * /api/teachers/{teacherId}/students:
 *   get:
 *     summary: Estudiantes asignados a un docente
 *     description: El propio docente o el administrador. Un docente que consulta el grupo de otro docente recibe 403.
 *     tags: [Teachers]
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
 *         description: Lista de estudiantes del docente
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *       403:
 *         description: Rol no permitido o grupo de otro docente
 *       404:
 *         description: El docente no existe
 *   post:
 *     summary: Asignar un estudiante a un docente (solo ADMIN)
 *     description: |
 *       Del cuerpo solo se lee `studentId`. Validar el formato no basta: también se comprueba
 *       que el estudiante exista (400), que tenga rol USER (409), que el docente tenga rol DOCENTE (409)
 *       y que la asignación no exista ya (409).
 *     tags: [Teachers]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId]
 *             properties:
 *               studentId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Estudiante asignado
 *       400:
 *         description: studentId ausente, mal formado o de un usuario que no existe
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *       403:
 *         $ref: '#/components/responses/SinPermisoRol'
 *       404:
 *         description: El docente no existe
 *       409:
 *         description: Roles incorrectos o asignación duplicada
 */

/**
 * @swagger
 * /api/teachers/{teacherId}/students/{studentId}:
 *   delete:
 *     summary: Retirar un estudiante del grupo de un docente (solo ADMIN)
 *     tags: [Teachers]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Asignación eliminada
 *       401:
 *         $ref: '#/components/responses/NoAutenticado'
 *       403:
 *         $ref: '#/components/responses/SinPermisoRol'
 *       404:
 *         description: Ese estudiante no estaba asignado al docente
 */

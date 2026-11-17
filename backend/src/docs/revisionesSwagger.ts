/**
 * @swagger
 * tags:
 *   - name: Revisiones Éticas y Agenda
 *     description: Agendamiento de revisiones, detección de conflictos (409) y control BOLA/IDOR (Bloques E y F / Citas)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     RevisionEntrada:
 *       type: object
 *       required:
 *         - estudianteId
 *         - docenteId
 *         - laboratorioId
 *         - fecha
 *         - hora
 *         - motivo
 *       properties:
 *         estudianteId:
 *           type: integer
 *           example: 1
 *         docenteId:
 *           type: integer
 *           example: 1
 *         laboratorioId:
 *           type: integer
 *           example: 1
 *         fecha:
 *           type: string
 *           format: date
 *           example: "2027-10-15"
 *         hora:
 *           type: string
 *           example: "09:30:00"
 *         motivo:
 *           type: string
 *           example: Auditoría de originalidad, perplejidad y similitud semántica en tesis de IA
 *     EstadoRevisionEntrada:
 *       type: object
 *       required:
 *         - estado
 *       properties:
 *         estado:
 *           type: string
 *           enum:
 *             - programada
 *             - confirmada
 *             - atendida
 *             - cancelada
 *           example: confirmada
 *     RevisionSalida:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           example: 1
 *         estudianteId:
 *           type: integer
 *           example: 1
 *         docenteId:
 *           type: integer
 *           example: 1
 *         fecha:
 *           type: string
 *           example: "2027-10-15"
 *         hora:
 *           type: string
 *           example: "09:30"
 *         motivo:
 *           type: string
 *           example: Auditoría de originalidad, perplejidad y similitud semántica en tesis de IA
 *         estado:
 *           type: string
 *           example: programada
 */

/**
 * @swagger
 * /api/revisiones:
 *   get:
 *     tags:
 *       - Revisiones Éticas y Agenda
 *     summary: Listar todas las revisiones del sistema
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de revisiones obtenida correctamente
 *   post:
 *     tags:
 *       - Revisiones Éticas y Agenda
 *     summary: 14 & 15. Crear Revisión Ética Válida / Conflicto de Horario (201 Created / 409 Conflict)
 *     description: >
 *       Permite a un administrador programar una revisión académica.
 *       Si el docente ya tiene otra revisión en la misma fecha y hora, el sistema detecta
 *       el solapamiento y responde 409 Conflict.
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RevisionEntrada'
 *     responses:
 *       201:
 *         description: Revisión programada exitosamente (estado inicial programada)
 *       400:
 *         description: Datos inválidos
 *       403:
 *         description: Requiere rol de administrador
 *       409:
 *         description: Conflicto de horario (el docente o laboratorio ya está ocupado en ese horario)
 */

/**
 * @swagger
 * /api/revisiones/mis-revisiones:
 *   get:
 *     tags:
 *       - Revisiones Éticas y Agenda
 *     summary: 18. Consultar Revisiones Propias del Estudiante (200 OK - BOLA Seguro)
 *     description: >
 *       Endpoint seguro que extrae la identidad del estudiante desde el token JWT.
 *       Garantiza que el estudiante únicamente acceda a sus propias auditorías.
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Revisiones propias del estudiante autenticado
 *       401:
 *         description: Token no suministrado o inválido
 */

/**
 * @swagger
 * /api/revisiones/{id}:
 *   get:
 *     tags:
 *       - Revisiones Éticas y Agenda
 *     summary: 19. Consultar Revisión por ID (Defensa contra BOLA / IDOR - 403 Forbidden)
 *     description: >
 *       Permite consultar el detalle de una revisión. Si un estudiante autenticado intenta
 *       consultar una revisión ajena perteneciente a otro autor, se bloquea con 403 Forbidden.
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
 *         description: Detalle de la revisión encontrada
 *       403:
 *         description: Acceso denegado (el recurso no le pertenece - BOLA protegido)
 *       404:
 *         description: Revisión no encontrada
 *   delete:
 *     tags:
 *       - Revisiones Éticas y Agenda
 *     summary: Eliminar Revisión
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
 *         description: Revisión eliminada
 *       404:
 *         description: Revisión no encontrada
 */

/**
 * @swagger
 * /api/revisiones/{id}/estado:
 *   patch:
 *     tags:
 *       - Revisiones Éticas y Agenda
 *     summary: 16 & 17. Cambio de Estado Válido e Inválido (200 OK / 409 Conflict)
 *     description: >
 *       Permite cambiar el estado de la revisión:
 *       - Transición válida: programada -> confirmada (200 OK) -> atendida (200 OK).
 *       - Transición inválida: de atendida a programada (409 Conflict).
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
 *             $ref: '#/components/schemas/EstadoRevisionEntrada'
 *     responses:
 *       200:
 *         description: Estado de la revisión actualizado correctamente
 *       409:
 *         description: Transición de estado inválida
 */


/**
 * @swagger
 * /api/revisiones/mi-contexto:
 *   get:
 *     tags:
 *       - Revisiones Éticas y Agenda
 *     summary: Contexto integral del usuario autenticado y su ficha de negocio
 *     description: >
 *       Retorna los datos del usuario autenticado junto con su registro de negocio asociado
 *       (estudiante con documento/ficha académica, docente con registro y departamento, o administrador).
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Contexto recuperado correctamente
 *       401:
 *         description: Token no proporcionado o inválido
 */

/**
 * @swagger
 * /api/estadisticas/resumen:
 *   get:
 *     tags:
 *       - Revisiones Éticas y Agenda
 *     summary: Resumen estadístico consolidado para dashboard administrativo
 *     description: >
 *       Retorna el cómputo total de usuarios, estudiantes, docentes, departamentos,
 *       laboratorios y revisiones desglosadas por estado para la vista de supervisión institucional.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas obtenidas exitosamente
 *       401:
 *         description: No autenticado
 *       403:
 *         description: Requiere rol de administrador
 */

/**
 * @swagger
 * /api/revisiones/{id}/confirmar:
 *   patch:
 *     tags:
 *       - Revisiones Éticas y Agenda
 *     summary: Confirmar una revisión programada
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Revisión confirmada exitosamente
 *       404:
 *         description: Revisión no encontrada
 *       409:
 *         description: Transición inválida (debe estar en estado programada)
 */

/**
 * @swagger
 * /api/revisiones/{id}/atender:
 *   patch:
 *     tags:
 *       - Revisiones Éticas y Agenda
 *     summary: Atender una revisión confirmada
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Revisión atendida exitosamente
 *       404:
 *         description: Revisión no encontrada
 *       409:
 *         description: Transición inválida (debe estar en estado confirmada)
 */

/**
 * @swagger
 * /api/revisiones/{id}/cancelar:
 *   patch:
 *     tags:
 *       - Revisiones Éticas y Agenda
 *     summary: Cancelar una revisión no atendida
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Revisión cancelada exitosamente
 *       404:
 *         description: Revisión no encontrada
 *       409:
 *         description: Transición inválida (no se puede cancelar una revisión ya atendida)
 */

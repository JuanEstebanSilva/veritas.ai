// userSwagger.ts - Documentación OpenAPI para los endpoints de Administración de Usuarios (Users)

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Gestión administrativa de usuarios, métricas de plataforma, control de roles e integridad referencial (Requiere rol ADMIN)
 */

/**
 * @swagger
 * /api/users/stats:
 *   get:
 *     summary: Obtener estadísticas y métricas globales del sistema
 *     description: Retorna métricas cuantitativas sobre usuarios activos, cuentas premium, análisis realizados e ingresos generados. Exclusivo para administradores.
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas generales obtenidas correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: integer
 *                       example: 45
 *                     activeUsers:
 *                       type: integer
 *                       example: 42
 *                     premiumUsers:
 *                       type: integer
 *                       example: 12
 *                     freeUsers:
 *                       type: integer
 *                       example: 33
 *                     totalAnalyses:
 *                       type: integer
 *                       example: 180
 *                     analysesToday:
 *                       type: integer
 *                       example: 15
 *                     totalRevenueUsd:
 *                       type: number
 *                       example: 24.00
 *       401:
 *         description: API Key ausente o inválida / Token de sesión no suministrado.
 *       403:
 *         description: Acceso denegado. Se requiere rol de Administrador (ADMIN).
 *       500:
 *         description: Error interno al obtener métricas.
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Listar todos los usuarios con paginación y filtros
 *     description: Retorna la lista paginada de usuarios registrados en el sistema, permitiendo búsquedas por nombre, email, rol y estado.
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Cantidad de registros por página
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Término de búsqueda (coincide con nombre, apellido o correo)
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [USER, ADMIN]
 *         description: Filtrar por rol de usuario
 *       - in: query
 *         name: isActive
 *         schema:
 *           type: boolean
 *         description: Filtrar por estado activo (true/false)
 *     responses:
 *       200:
 *         description: Lista de usuarios recuperada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       last_name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       role:
 *                         type: string
 *                         enum: [USER, ADMIN]
 *                       is_active:
 *                         type: boolean
 *                       is_premium:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: No autenticado o API Key requerida/inválida.
 *       403:
 *         description: Permisos insuficientes (requiere ADMIN).
 *       500:
 *         description: Error al consultar usuarios.
 */

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtener el detalle completo de un usuario por ID
 *     description: Retorna la información de perfil, historial de análisis recientes y pagos asociados a un usuario específico.
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identificador UUID único del usuario
 *     responses:
 *       200:
 *         description: Detalle del usuario obtenido exitosamente.
 *       401:
 *         description: No autenticado o API Key requerida/inválida.
 *       403:
 *         description: Permisos insuficientes (requiere ADMIN).
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error al consultar usuario.
 */

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crear un nuevo usuario desde el panel administrativo
 *     description: Permite al administrador dar de alta una nueva cuenta de usuario. Siempre se asigna rol USER por diseño de seguridad.
 *     tags: [Users]
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
 *               - name
 *               - last_name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Andrés
 *               last_name:
 *                 type: string
 *                 example: Gómez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: andres.gomez@ejemplo.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: UsuarioSeguro2026!
 *               is_premium:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Usuario creado exitosamente.
 *       400:
 *         description: Faltan campos obligatorios o formato inválido.
 *       401:
 *         description: No autenticado o API Key requerida/inválida.
 *       403:
 *         description: Permisos insuficientes (requiere ADMIN).
 *       409:
 *         description: El correo electrónico ya se encuentra registrado.
 *       500:
 *         description: Error al crear usuario.
 */

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualizar la información de un usuario
 *     description: Modifica los datos personales, estado activo, membresía premium o credencial de acceso de un usuario.
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Identificador UUID único del usuario a modificar
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Andrés Felipe
 *               last_name:
 *                 type: string
 *                 example: Gómez Castro
 *               email:
 *                 type: string
 *                 format: email
 *                 example: andres.actualizado@ejemplo.com
 *               is_active:
 *                 type: boolean
 *                 example: true
 *               is_premium:
 *                 type: boolean
 *                 example: true
 *               password:
 *                 type: string
 *                 format: password
 *                 example: NuevaClaveSegura2026!
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente.
 *       401:
 *         description: No autenticado o API Key requerida/inválida.
 *       403:
 *         description: Permisos insuficientes (requiere ADMIN).
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error al actualizar usuario.
 */

/**
 * @swagger
 * /api/users/{id}/toggle-active:
 *   patch:
 *     summary: Alternar estado activo / inactivo de un usuario
 *     description: Habilita o suspende la cuenta de un usuario. Previene la auto-suspensión de la cuenta del administrador que ejecuta la petición.
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID del usuario cuyo estado se desea alternar
 *     responses:
 *       200:
 *         description: Estado activo/inactivo alternado exitosamente.
 *       400:
 *         description: No puedes desactivar tu propia cuenta de administrador.
 *       401:
 *         description: No autenticado o API Key requerida/inválida.
 *       403:
 *         description: Permisos insuficientes (requiere ADMIN).
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error al cambiar estado del usuario.
 */

/**
 * @swagger
 * /api/users/{id}/toggle-premium:
 *   patch:
 *     summary: Otorgar o revocar membresía Premium administrativamente
 *     description: Modifica directamente el estado de suscripción Premium del usuario sin requerir interacción con la pasarela de pagos Stripe.
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID del usuario a modificar
 *     responses:
 *       200:
 *         description: Estado Premium modificado exitosamente.
 *       401:
 *         description: No autenticado o API Key requerida/inválida.
 *       403:
 *         description: Permisos insuficientes (requiere ADMIN).
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error al modificar estado Premium.
 */

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Eliminar un usuario con verificación de Integridad Referencial
 *     description: |
 *       Elimina una cuenta de usuario del sistema cumpliendo con las reglas de Integridad Referencial (Lab 5):
 *       - **409 Conflict**: Si el usuario tiene análisis de texto o pagos registrados en el sistema, se rechaza la eliminación para prevenir registros huérfanos.
 *       - **400 Bad Request**: Si el identificador no tiene formato UUID válido, o si el administrador intenta autoeliminarse.
 *       - **403 Forbidden**: No se permite eliminar cuentas administradoras.
 *       - **404 Not Found**: Si el ID no corresponde a un usuario existente.
 *       - **200 OK**: Si el usuario no posee registros dependientes asociados.
 *     tags: [Users]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: UUID del usuario a eliminar
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente (no tenía registros huérfanos).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Usuario eliminado correctamente.
 *       400:
 *         description: Identificador con formato UUID inválido / No puedes eliminar tu propia cuenta de administrador.
 *       401:
 *         description: API Key ausente o inválida / Token de autorización no suministrado.
 *       403:
 *         description: La cuenta de administrador no puede ser eliminada / Permisos insuficientes.
 *       404:
 *         description: Usuario no encontrado.
 *       409:
 *         description: Conflicto de Integridad Referencial - El usuario tiene análisis o pagos asociados.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: No se puede eliminar el usuario porque tiene análisis o pagos asociados
 *       500:
 *         description: Error interno al procesar la eliminación.
 */

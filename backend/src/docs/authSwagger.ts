// authSwagger.ts - Documentación OpenAPI para los endpoints de Autenticación
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints de autenticación, registro, inicio de sesión y perfil de usuario
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registrar un nuevo usuario
 *     description: Permite registrar una nueva cuenta de usuario en la plataforma. Requiere API Key en el header.
 *     tags: [Auth]
 *     security:
 *       - ApiKeyAuth: []
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
 *               - confirm_password
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan
 *               last_name:
 *                 type: string
 *                 example: Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan.perez@ejemplo.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Password123!Secure
 *               confirm_password:
 *                 type: string
 *                 format: password
 *                 example: Password123!Secure
 *     responses:
 *       201:
 *         description: Usuario registrado exitosamente. Retorna token JWT.
 *       400:
 *         description: Datos inválidos o contraseñas no coinciden.
 *       401:
 *         description: API Key requerida o inválida.
 *       409:
 *         description: El correo electrónico ya está registrado.
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: Autentica al usuario con correo y contraseña, retornando un token JWT para usar en BearerAuth.
 *     tags: [Auth]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: admin@veritas.ai
 *               password:
 *                 type: string
 *                 format: password
 *                 example: Admin123!Secure*
 *     responses:
 *       200:
 *         description: Autenticación exitosa. Retorna el token JWT y datos del usuario.
 *       400:
 *         description: Parámetros incompletos.
 *       401:
 *         description: Credenciales incorrectas o API Key inválida.
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     description: Retorna la información del usuario autenticado actualmente mediante JWT.
 *     tags: [Auth]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del perfil del usuario.
 *       401:
 *         description: No autenticado (Token JWT inválido o ausente, o API Key ausente).
 */

/**
 * @swagger
 * /api/auth/me:
 *   put:
 *     summary: Actualizar perfil del usuario actual
 *     description: Permite actualizar el nombre o apellido del usuario autenticado.
 *     tags: [Auth]
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
 *               name:
 *                 type: string
 *                 example: Juan Carlos
 *               last_name:
 *                 type: string
 *                 example: Pérez Gómez
 *     responses:
 *       200:
 *         description: Perfil actualizado correctamente.
 *       401:
 *         description: No autenticado.
 */

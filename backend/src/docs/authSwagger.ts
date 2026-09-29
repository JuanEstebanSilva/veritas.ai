// authSwagger.ts - Documentación OpenAPI para los endpoints de Autenticación (Laboratorio 8)
/**
 * @swagger
 * tags:
 *   - name: Autenticación
 *     description: Endpoints de autenticación, registro, inicio de sesión y perfil de usuario
 *   - name: Auth
 *     description: Alias en inglés para autenticación
 */

/**
 * @swagger
 * /api/auth/registro:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registrar un nuevo usuario
 *     description: >
 *       Registra un nuevo usuario utilizando bcrypt para proteger
 *       la contraseña. El rol es asignado por el servidor y no puede
 *       ser definido por el cliente.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistroUsuario'
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: API Key requerida o inválida
 *       409:
 *         description: Correo electrónico ya registrado
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: Registrar un nuevo usuario (Alias /register)
 *     description: >
 *       Registra un nuevo usuario utilizando bcrypt para proteger
 *       la contraseña. El rol es asignado por el servidor y no puede
 *       ser definido por el cliente.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistroUsuario'
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: API Key requerida o inválida
 *       409:
 *         description: Correo electrónico ya registrado
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Iniciar sesión
 *     description: |
 *       Verifica correo y contraseña con bcrypt y devuelve un token JWT para usar en BearerAuth.
 *
 *       - **401 «Credenciales inválidas»** tanto si el correo no existe como si la contraseña falla:
 *         el mensaje y el tiempo de respuesta son los mismos, para no revelar qué correos están registrados.
 *       - **403** solo si la contraseña es correcta pero la cuenta está desactivada.
 *     tags:
 *       - Autenticación
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUsuario'
 *     responses:
 *       200:
 *         description: Autenticación correcta. Devuelve el token JWT y los datos públicos del usuario.
 *       400:
 *         description: Faltan el correo o la contraseña.
 *       401:
 *         description: Credenciales inválidas, o API Key requerida / inválida.
 *       403:
 *         description: Cuenta desactivada (solo tras verificar la contraseña) o API Key deshabilitada.
 */

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Obtener perfil del usuario actual
 *     description: Retorna la información del usuario autenticado actualmente mediante JWT.
 *     tags:
 *       - Autenticación
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
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
 *     tags:
 *       - Autenticación
 *     security:
 *       - ApiKeyAuth: []
 *       - BearerAuth: []
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

/**
 * @swagger
 * components:
 *   schemas:
 *     RegistroUsuario:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - password
 *       properties:
 *         nombre:
 *           type: string
 *           example: Estudiante Veritas
 *         email:
 *           type: string
 *           format: email
 *           example: estudiante@veritas.ai
 *         password:
 *           type: string
 *           format: password
 *           example: ClaveSegura2026!
 *         name:
 *           type: string
 *           example: Estudiante
 *         last_name:
 *           type: string
 *           example: Veritas
 *         confirm_password:
 *           type: string
 *           format: password
 *           example: ClaveSegura2026!
 *     LoginUsuario:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: estudiante@veritas.ai
 *         password:
 *           type: string
 *           format: password
 *           example: ClaveSegura2026!
 */

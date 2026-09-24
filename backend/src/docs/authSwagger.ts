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
 *     description: |
 *       Crea una cuenta con rol **USER**. Requiere API Key: el cliente se identifica antes que la persona.
 *
 *       La contraseña se guarda con **bcrypt** (salt aleatorio y coste 12) y nunca aparece en la respuesta.
 *       Los campos privilegiados que se envíen en el cuerpo (`role`, `is_active`, `is_premium`,
 *       `password_hash`…) se descartan: el servidor solo lee los campos de `RegistroUsuario`.
 *     tags: [Auth]
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
 *         description: Usuario registrado. Devuelve el token JWT y los datos públicos del usuario (sin hash).
 *       400:
 *         description: Datos inválidos, contraseñas distintas o contraseña fuera de 10–72 caracteres.
 *       401:
 *         description: API Key requerida o inválida.
 *       403:
 *         description: API Key deshabilitada.
 *       409:
 *         description: El correo electrónico ya está registrado.
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
 *     tags: [Auth]
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

/**
 * @swagger
 * components:
 *   schemas:
 *     RegistroUsuario:
 *       type: object
 *       description: Únicos campos que el servidor lee al registrar. Cualquier otro se descarta.
 *       required: [name, last_name, email, password, confirm_password]
 *       properties:
 *         name:
 *           type: string
 *           example: Ana
 *         last_name:
 *           type: string
 *           example: Torres
 *         email:
 *           type: string
 *           format: email
 *           example: ana.torres@universidad.edu
 *         password:
 *           type: string
 *           format: password
 *           minLength: 10
 *           maxLength: 72
 *           description: Entre 10 y 72 caracteres (bcrypt solo procesa 72 bytes).
 *           example: ClaveSegura2026!
 *         confirm_password:
 *           type: string
 *           format: password
 *           example: ClaveSegura2026!
 *     LoginUsuario:
 *       type: object
 *       required: [email, password]
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: ana.torres@universidad.edu
 *         password:
 *           type: string
 *           format: password
 *           example: ClaveSegura2026!
 */

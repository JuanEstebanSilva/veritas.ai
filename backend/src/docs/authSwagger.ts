/**
 * @swagger
 * tags:
 *   - name: Autenticación
 *     description: Inicio de sesión (JWT HS256), registro público de estudiantes y perfil de usuario (Bloque A)
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginEntrada:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: admin@veritas.ai
 *         password:
 *           type: string
 *           format: password
 *           example: SANTOTO_2026--2
 *     RegistroEstudianteEntrada:
 *       type: object
 *       required:
 *         - nombre
 *         - email
 *         - password
 *       properties:
 *         nombre:
 *           type: string
 *           example: Estudiante Investigador Demo
 *         email:
 *           type: string
 *           format: email
 *           example: estudiante.demo@veritas.ai
 *         password:
 *           type: string
 *           format: password
 *           example: Password123*
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: 1 & 2. Iniciar sesión y obtener JWT (200 OK / 401 Unauthorized)
 *     description: >
 *       Autentica credenciales con bcrypt y genera un token JWT firmado mediante HS256.
 *       Si la contraseña es errónea, responde 401 Unauthorized.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginEntrada'
 *     responses:
 *       200:
 *         description: Autenticación exitosa, retorna token JWT
 *       401:
 *         description: Credenciales inválidas
 *
 * /api/auth/registro:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: 3. Registro de Estudiante / Autor (201 Created)
 *     description: >
 *       Permite el registro público asignando en el servidor el rol seguro de estudiante/autor.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegistroEstudianteEntrada'
 *     responses:
 *       201:
 *         description: Estudiante registrado exitosamente
 *       400:
 *         description: Datos inválidos
 *       409:
 *         description: Correo electrónico ya registrado
 *
 * /api/auth/perfil:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: 4. Consultar Perfil con Bearer Token (200 OK)
 *     description: >
 *       Retorna la información del usuario autenticado a partir del JWT enviado en el header Authorization.
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario obtenido correctamente
 *       401:
 *         description: Token no suministrado o inválido
 */

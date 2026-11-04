/**
 * @swagger
 * tags:
 *   - name: Autenticación
 *     description: Bloque 11 — Autenticación segura, cambio de contraseña con version_sesion, recuperación administrativa y códigos de respaldo de Veritas AI
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
 *
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
 *
 *     CambioPasswordEntrada:
 *       type: object
 *       required:
 *         - passwordActual
 *         - passwordNueva
 *         - confirmarPassword
 *       properties:
 *         passwordActual:
 *           type: string
 *           format: password
 *           example: Password123*
 *         passwordNueva:
 *           type: string
 *           format: password
 *           example: NuevaPassword2026!
 *         confirmarPassword:
 *           type: string
 *           format: password
 *           example: NuevaPassword2026!
 *
 *     RestablecerPasswordEntrada:
 *       type: object
 *       required:
 *         - token
 *         - passwordNueva
 *         - confirmarPassword
 *       properties:
 *         token:
 *           type: string
 *           example: 4a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f809
 *         passwordNueva:
 *           type: string
 *           format: password
 *           example: NuevaClaveReset2026!
 *         confirmarPassword:
 *           type: string
 *           format: password
 *           example: NuevaClaveReset2026!
 *
 *     GenerarCodigosEntrada:
 *       type: object
 *       required:
 *         - passwordActual
 *       properties:
 *         passwordActual:
 *           type: string
 *           format: password
 *           example: Password123*
 *
 *     RestablecerConCodigoEntrada:
 *       type: object
 *       required:
 *         - email
 *         - codigo
 *         - passwordNueva
 *         - confirmarPassword
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: estudiante.demo@veritas.ai
 *         codigo:
 *           type: string
 *           example: A1B2-C3D4-E5F6-0718-9A0B-1C2D-3E4F-5A6B
 *         passwordNueva:
 *           type: string
 *           format: password
 *           example: NuevaClaveCodigo2026!
 *         confirmarPassword:
 *           type: string
 *           format: password
 *           example: NuevaClaveCodigo2026!
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: 1. Iniciar sesión y obtener JWT con version_sesion (vs)
 *     description: >
 *       Verifica credenciales con bcrypt y genera un token JWT firmado mediante HS256 con payload { email, rol, vs }.
 *       Login público controlado: no exige cabecera X-API-Key.
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginEntrada'
 *     responses:
 *       200:
 *         description: Autenticación exitosa, retorna token JWT con versión de sesión
 *       400:
 *         description: Datos o JSON inválidos
 *       401:
 *         description: Credenciales inválidas
 *       403:
 *         description: Usuario deshabilitado
 *
 * /api/auth/registro:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: 2. Registro público de Estudiante / Autor
 *     description: >
 *       Registra un nuevo usuario en la plataforma Veritas AI asignando en el servidor el rol seguro de estudiante/autor.
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
 *     summary: 3. Consultar Perfil con Bearer Token
 *     description: >
 *       Retorna la información del usuario autenticado a partir del JWT enviado en el header Authorization.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario obtenido correctamente
 *       401:
 *         description: Token no suministrado, expirado o inválido
 *
 * /api/auth/cambiar-password:
 *   patch:
 *     tags:
 *       - Autenticación
 *     summary: 4. Cambiar la contraseña propia e invalidar sesiones JWT anteriores
 *     description: >
 *       Valida la contraseña actual, actualiza el hash bcrypt e incrementa version_sesion en public.usuarios.
 *       Todos los tokens JWT emitidos previamente son invalidados de inmediato (Sesión revocada).
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CambioPasswordEntrada'
 *     responses:
 *       200:
 *         description: Contraseña actualizada y sesiones anteriores revocadas
 *       400:
 *         description: Datos inválidos o contraseña nueva idéntica a la actual
 *       401:
 *         description: Contraseña actual inválida o JWT ausente/revocado
 *       409:
 *         description: Conflicto de concurrencia al actualizar contraseña
 *
 * /api/auth/recuperacion/admin/{usuarioId}:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: 5. Docente o Administrador autoriza recuperación y emite token temporal
 *     description: >
 *       Permite a un administrador o docente de Veritas AI autorizar la recuperación de una cuenta de prueba
 *       emitiendo un token temporal de 15 minutos (almacenado como hash SHA-256 en password_reset_tokens).
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: usuarioId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID numérico del estudiante o cuenta a recuperar
 *     responses:
 *       201:
 *         description: Token temporal generado exitosamente
 *       401:
 *         description: JWT ausente o inválido
 *       403:
 *         description: Rol no autorizado (solo administradores)
 *       404:
 *         description: Usuario no encontrado o inactivo
 *
 * /api/auth/restablecer-password:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: 6. Restablecer contraseña con token temporal de un solo uso
 *     description: >
 *       Consume el token temporal de recuperación administrativa, cambia la contraseña,
 *       invalida tokens y códigos de respaldo anteriores e incrementa version_sesion.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestablecerPasswordEntrada'
 *     responses:
 *       200:
 *         description: Contraseña restablecida correctamente
 *       400:
 *         description: Token inválido, expirado, ya utilizado o datos incorrectos
 *       429:
 *         description: Demasiados intentos
 *
 * /api/auth/codigos-recuperacion:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: 7. Generar ocho códigos de respaldo de un solo uso
 *     description: >
 *       Exige reautenticación con la contraseña actual, invalida códigos anteriores
 *       y devuelve 8 códigos de respaldo mostrados una sola vez (sus hashes SHA-256 se guardan en BD).
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerarCodigosEntrada'
 *     responses:
 *       201:
 *         description: Ocho códigos de respaldo emitidos exitosamente
 *       401:
 *         description: Contraseña actual inválida o reautenticación fallida
 *
 * /api/auth/codigos-recuperacion/estado:
 *   get:
 *     tags:
 *       - Autenticación
 *     summary: 8. Consultar cantidad de códigos de respaldo disponibles
 *     description: >
 *       Retorna el saldo de códigos de respaldo activos no consumidos del usuario autenticado.
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Conteo de códigos disponibles
 *       401:
 *         description: JWT no suministrado o inválido
 *
 * /api/auth/codigos-recuperacion/regenerar:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: 9. Regenerar códigos de respaldo (invalida los anteriores)
 *     description: >
 *       Invalida los códigos anteriores y emite ocho nuevos códigos de respaldo.
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GenerarCodigosEntrada'
 *     responses:
 *       201:
 *         description: Nuevos códigos de respaldo generados
 *       401:
 *         description: Reautenticación fallida
 *
 * /api/auth/restablecer-con-codigo:
 *   post:
 *     tags:
 *       - Autenticación
 *     summary: 10. Restablecer contraseña utilizando un código de respaldo de un solo uso
 *     description: >
 *       Consume un código de respaldo válido, cambia la contraseña e incrementa version_sesion.
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RestablecerConCodigoEntrada'
 *     responses:
 *       200:
 *         description: Contraseña restablecida con código de respaldo
 *       400:
 *         description: Código inválido, ya utilizado o cuenta errónea
 *       429:
 *         description: Demasiados intentos
 */

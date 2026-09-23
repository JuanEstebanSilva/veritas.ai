/**
 * @swagger
 * tags:
 *   - name: Security
 *     description: Identificación de la aplicación cliente que consume la API a partir de su API Key (Lab 6).
 */

/**
 * @swagger
 * /api/security/client:
 *   get:
 *     summary: Identificar la aplicación cliente que realiza la petición
 *     description: |
 *       Responde a la pregunta «¿qué aplicación me está llamando?». Cada consumidor tiene su propia
 *       API Key y el servidor solo guarda su hash SHA-256; al coincidir, el middleware deja en la
 *       petición el cliente identificado.
 *
 *       - **401**: no se envió `X-API-Key`, o su hash no coincide con ningún cliente registrado.
 *       - **403**: la clave es correcta pero el cliente está deshabilitado.
 *
 *       Todavía no identifica a la persona que usa la aplicación: eso lo resuelve el login con JWT.
 *     tags: [Security]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: Cliente autenticado.
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
 *                   example: Cliente autenticado
 *                 client:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Postman Laboratorio
 *       401:
 *         description: API Key requerida o inválida.
 *       403:
 *         description: API Key deshabilitada.
 */

// paymentSwagger.ts - Swagger JSDoc annotations for Payment endpoints

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Operaciones de pagos y suscripciones via Stripe
 */

/**
 * @swagger
 * /api/payments/create-checkout-session:
 *   post:
 *     summary: Crear sesión de checkout de Stripe (modo producción o test)
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: URL de checkout generada o modo sandbox disponible
 *       400:
 *         description: El usuario ya posee suscripción Premium
 *       500:
 *         description: Error interno del servidor
 */

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Webhook de Stripe para recibir eventos de pagos
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Webhook procesado correctamente
 *       400:
 *         description: Falta encabezado stripe-signature o payload inválido
 */

/**
 * @swagger
 * /api/payments/sandbox-init:
 *   post:
 *     summary: Iniciar sesión de pago en modo Sandbox (pruebas)
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Información de transacción sandbox iniciada
 *       500:
 *         description: Error al iniciar pago sandbox
 */

/**
 * @swagger
 * /api/payments/sandbox-confirm:
 *   post:
 *     summary: Confirmar transacción en modo Sandbox
 *     tags: [Payments]
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
 *               transactionId:
 *                 type: string
 *                 description: ID de la transacción sandbox
 *               simulateSuccess:
 *                 type: boolean
 *                 description: Simular éxito del pago (default true)
 *     responses:
 *       200:
 *         description: Pago sandbox confirmado, usuario premium activado
 *       400:
 *         description: Parámetros inválidos o error en confirmación
 */

/**
 * @swagger
 * /api/payments/history:
 *   get:
 *     summary: Obtener historial de pagos del usuario autenticado
 *     tags: [Payments]
 *     security:
 *       - ApiKeyAuth: []
 *         BearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de pagos realizados
 *       500:
 *         description: Error al consultar pagos
 */

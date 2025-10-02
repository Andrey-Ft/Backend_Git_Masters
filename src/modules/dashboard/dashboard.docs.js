/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Visualización general de métricas del usuario.
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Obtiene la información del dashboard del usuario autenticado
 *     description: Retorna el resumen del usuario, su ranking, insignias, historial de actividad y ranking de equipos.
 *     tags: [Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Datos obtenidos correctamente.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardResponse'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

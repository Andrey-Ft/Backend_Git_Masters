// src/docs/spec.js

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: token
 *       description: Autenticación mediante una cookie httpOnly llamada "token".

 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           example: "Error interno del servidor."

 *     Badge:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: "Master Coder"
 *         description:
 *           type: string
 *           example: "Otorgada por resolver más de 50 issues"

 *     ActivityLog:
 *       type: object
 *       properties:
 *         action:
 *           type: string
 *           example: "Commit realizado"
 *         timestamp:
 *           type: string
 *           format: date-time
 *           example: "2025-09-29T15:23:01.000Z"

 *     TeamRanking:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "team123"
 *         name:
 *           type: string
 *           example: "Team Alpha"
 *         totalPoints:
 *           type: integer
 *           example: 1500

 *     DashboardResponse:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           example: "cln2k9j0a0001t0vfj8h7zq9x"
 *         pointsTotal:
 *           type: integer
 *           example: 350
 *         rank:
 *           type: integer
 *           example: 5
 *         badges:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Badge'
 *         history:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/ActivityLog'
 *         teamRanking:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/TeamRanking'

 *   responses:
 *     UnauthorizedError:
 *       description: No autenticado o token inválido.
 *     InternalServerError:
 *       description: Error interno del servidor.
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ErrorResponse'
 */

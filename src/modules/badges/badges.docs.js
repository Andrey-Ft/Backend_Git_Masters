// src/modules/badges/badges.docs.js

/**
 * @swagger
 * tags:
 *   - name: Badges
 *     description: Gestión y consulta de insignias.
 */

/**
 * @swagger
 * /badges:
 *   get:
 *     summary: Obtiene todas las insignias disponibles.
 *     description: Retorna una lista de todas las insignias registradas en el sistema.
 *     tags: [Badges]
 *     responses:
 *       200:
 *         description: Lista de insignias obtenida exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   key:
 *                     type: string
 *                     example: commit_perfecto
 *                   name:
 *                     type: string
 *                     example: "Commit Perfecto"
 *                   description:
 *                     type: string
 *                     example: "Se otorga por mantener una alta calidad en los commits."
 *       500:
 *         description: Error interno del servidor.
 */

/**
 * @swagger
 * /badges/user/{username}:
 *   get:
 *     summary: Obtiene las insignias de un usuario.
 *     description: Retorna todas las insignias que un usuario específico ha ganado.
 *     tags: [Badges]
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: Nombre de usuario del cual se quieren obtener las insignias.
 *     responses:
 *       200:
 *         description: Lista de insignias ganadas por el usuario.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   key:
 *                     type: string
 *                     example: revisor_experto
 *                   name:
 *                     type: string
 *                     example: "Revisor Experto"
 *                   description:
 *                     type: string
 *                     example: "Insignia otorgada por realizar revisiones de calidad."
 *                   obtainedAt:
 *                     type: string
 *                     format: date-time
 *                     example: "2025-09-01T14:30:00.000Z"
 *       404:
 *         description: Usuario no encontrado.
 *       500:
 *         description: Error interno del servidor.
 */

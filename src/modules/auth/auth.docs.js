/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Autenticación con GitHub, sesión y perfil de usuario
 *
 * components:
 *   schemas:
 *     Badge:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Colaborador Estrella
 *         description:
 *           type: string
 *           example: Realizó más de 50 commits
 *     UserProfile:
 *       type: object
 *       description: Perfil completo del usuario, combinando datos del token y de la base de datos.
 *       properties:
 *         githubId:
 *           type: integer
 *           example: 123456
 *         username:
 *           type: string
 *           example: andrey-ft
 *         displayName:
 *           type: string
 *           example: Andrey
 *         avatarUrl:
 *           type: string
 *           format: uri
 *           example: https://avatars.githubusercontent.com/u/123456?v=4
 *         points:
 *           type: integer
 *           example: 250
 *           description: Balance de puntos del usuario
 *         level:
 *           type: integer
 *           example: 8
 *           description: Nivel actual del usuario
 *         badges:
 *           type: array
 *           description: Lista de insignias obtenidas por el usuario
 *           items:
 *             $ref: '#/components/schemas/Badge'
 *
 *   securitySchemes:
 *     cookieAuth:
 *       type: apiKey
 *       in: cookie
 *       name: token
 *       description: La sesión se mantiene a través de una cookie httpOnly llamada "token" que contiene el JWT.
 */

/**
 * @openapi
 * /auth/github:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Inicia la autenticación con GitHub
 *     description: Redirige al usuario a la página de autorización de GitHub para iniciar el flujo OAuth2.
 *     responses:
 *       302:
 *         description: Redirección exitosa a GitHub.
 */

/**
 * @openapi
 * /auth/github/callback:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Callback invocado por GitHub después de la autorización
 *     description: Procesa la respuesta de GitHub, genera un JWT, lo establece en una cookie httpOnly y redirige al frontend.
 *     responses:
 *       302:
 *         description: Redirección al dashboard del frontend en caso de éxito.
 */

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Obtiene el perfil completo del usuario autenticado
 *     description: Requiere una sesión activa (cookie) para devolver los datos del usuario, incluyendo puntos, nivel e insignias.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Perfil completo del usuario obtenido con éxito.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: No autenticado (cookie faltante o token inválido).
 *       404:
 *         description: El perfil no fue encontrado en la base de datos.
 */

/**
 * @openapi
 * /auth/logout:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Cierra la sesión del usuario
 *     description: Invalida la sesión en el servidor y limpia la cookie de sesión.
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Sesión cerrada exitosamente.
 *       500:
 *         description: Error interno al intentar cerrar la sesión.
 */

/**
 * @openapi
 * /auth/failure:
 *   get:
 *     tags:
 *       - Auth
 *     summary: Endpoint de fallo de autenticación
 *     description: Ruta a la que se redirige si falla la autenticación con GitHub.
 *     responses:
 *       200:
 *         description: Mensaje de fallo.
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Fallo la autenticación
 */

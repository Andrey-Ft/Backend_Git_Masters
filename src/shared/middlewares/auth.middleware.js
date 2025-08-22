import jwt from "jsonwebtoken";

/**
 * @function requireAuth
 * @description Middleware para proteger rutas. Verifica la existencia y validez de un JWT en las cookies.
 * @param {object} req - Objeto de la petición de Express.
 * @param {object} res - Objeto de la respuesta de Express.
 * @param {function} next - Función para pasar al siguiente middleware.
 */
function requireAuth(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ message: "No autorizado. Token faltante." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: "Token invalido o expirado." });
  }
}

export default requireAuth;

import passport from "passport";
import {
  generateAndSetToken,
  getCompleteProfile,
  cleanupSession,
} from "../service/auth.service.js";

// Iniciar autenticación con GitHub
export const loginWithGitHub = passport.authenticate("github", { scope: ["user:email"] });

// Callback de GitHub
export const githubCallback = (req, res, next) => {
  passport.authenticate("github", { session: false }, (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login-failed`);
    }

    // El servicio se encarga de crear el token y la cookie
    generateAndSetToken(res, user);

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  })(req, res, next);
};

// Obtener perfil completo
export const getProfile = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: "No autenticado" });
  }

  try {
    // El servicio se encarga de obtener y procesar los datos
    const userProfile = await getCompleteProfile(req.user.githubId);

    if (!userProfile) {
      return res.status(404).json({ message: "Perfil de usuario no encontrado en la base de datos." });
    }

    const responseData = {
      ...req.user,
      ...userProfile,
    };

    res.json(responseData);
  } catch (err) {
    console.error("Error al obtener perfil:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};

// Logout
export const logout = (req, res, next) => {
  // El servicio se encarga de toda la lógica de cierre de sesión
  cleanupSession(req, res, next);
};
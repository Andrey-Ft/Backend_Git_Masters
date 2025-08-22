// src/modules/auth/controller/auth.controller.js
import passport from "passport";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
 
const prisma = new PrismaClient();
 
// Iniciar autenticación con GitHub
export const loginWithGitHub = passport.authenticate("github", { scope: ["user:email"] });
 
// Callback de GitHub (Passport ya autenticó y puso req.user)
export const githubCallback = (req, res, next) => {
  passport.authenticate("github", { session: false }, async (err, user, info) => {
    if (err || !user) {
      return res.redirect(`${process.env.FRONTEND_URL}/login-failed`);
    }
 
    try {
      // Firma el JWT
      const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1d" });
 
      // Enviar cookie segura
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "Strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 día
      });
 
      return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
    } catch (error) {
      console.error("Error en githubCallback:", error);
      return res.status(500).json({ message: "Error interno del servidor" });
    }
  })(req, res, next);
};
 
// Obtener perfil completo
export const getProfile = async (req, res) => {
  if (!req.user) return res.status(401).json({ message: "No autenticado" });
 
  try {
    const user = await prisma.user.findUnique({
      where: { githubId: req.user.githubId },
      select: {
        pointsBalance: true,
        profile: { select: { level: true } },
        assignedBadges: {
          select: {
            badge: { select: { name: true, description: true } },
          },
        },
      },
    });
 
    if (!user) {
      return res.status(404).json({ message: "Perfil de usuario no encontrado en la base de datos." });
    }
 
    const badges = user.assignedBadges.map((ub) => ({
      name: ub.badge.name,
      description: ub.badge.description,
    }));
    
    const profileData = {
      ...req.user,
      points: user.pointsBalance ?? 0,
      level: user.profile?.level ?? 1,
      badges,
    };
 
    res.json(profileData);
  } catch (err) {
    console.error("Error al obtener perfil:", err);
    res.status(500).json({ message: "Error interno del servidor" });
  }
};
 

// Logout
export const logout = (req, res, next) => {
  // 1. Destruye la sesión de Passport en el servidor
  req.logout((err) => {
    if (err) {
      console.error("Error al ejecutar req.logout:", err);
      return next(err);
    }

    // 2. Destruye la sesión completa de express-session
    req.session.destroy((err) => {
      if (err) {
        console.error("Error al destruir la sesión:", err);
        return res.status(500).json({ message: "No se pudo cerrar la sesión." });
      }

      // 3. Dile al navegador que borre la cookie de la sesión
      // El nombre 'connect.sid' es el predeterminado de express-session.
      res.clearCookie('connect.sid', {
        path: '/', // IMPORTANTE: El path debe coincidir
        // Asegúrate de que las otras opciones (domain, secure) también coincidan
      });

      // 4. Envía una respuesta exitosa al frontend
      return res.status(200).json({ message: "Sesión cerrada exitosamente." });
    });
  });
};
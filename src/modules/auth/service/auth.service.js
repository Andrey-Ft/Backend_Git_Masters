// src/modules/auth/service/auth.service.js
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Se encarga de crear el token JWT y ponerlo en la cookie de la respuesta.
export const generateAndSetToken = (res, user) => {
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: "1d" });

  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
    maxAge: 24 * 60 * 60 * 1000, // 1 día
  });
};

// Se encarga de buscar el perfil del usuario y formatear los datos.
// No recibe 'res', solo los datos que necesita.
export const getCompleteProfile = async (githubId) => {
  const user = await prisma.user.findUnique({
    where: { githubId: githubId },
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
    return null; // Devuelve nulo si no se encuentra
  }

  const badges = user.assignedBadges.map((ub) => ({
    name: ub.badge.name,
    description: ub.badge.description,
  }));

  const profileData = {
    points: user.pointsBalance ?? 0,
    level: user.profile?.level ?? 1,
    badges,
  };

  return profileData;
};

// Se encarga de toda la lógica de cerrar la sesión
export const cleanupSession = (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Error al ejecutar req.logout:", err);
      return next(err);
    }

    req.session.destroy((err) => {
      if (err) {
        console.error("Error al destruir la sesión:", err);
        return res.status(500).json({ message: "No se pudo cerrar la sesión." });
      }

      res.clearCookie('connect.sid', {
        path: '/',
      });

      return res.status(200).json({ message: "Sesión cerrada exitosamente." });
    });
  });
};
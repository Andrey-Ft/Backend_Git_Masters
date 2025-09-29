import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { getUserProfile, updateUserProfile } from "../controller/profile.controller.js";
import requireAuth from "../../../shared/middlewares/auth.middleware.js";

const router = Router();
const prisma = new PrismaClient();

// Middleware para bypass de autenticación en Postman con una API Key
async function testBypassAuth(req, res, next) {
  const key = req.header('X-API-Key');
  if (process.env.TEST_API_KEY && key === process.env.TEST_API_KEY) {
    // Si la API key es correcta, busca el primer usuario para simular la sesión
    const testUser = await prisma.user.findFirst();
    if (testUser) {
      req.user = testUser; // ¡Clave! Asignamos el usuario a req.user
      return next();
    }
  }
  // Si no hay API Key o no se encuentra usuario, usa la autenticación real
  return requireAuth(req, res, next);
}

// @route   GET /profile
router.get("/", testBypassAuth, getUserProfile);

// @route   PATCH /profile
router.patch("/", testBypassAuth, updateUserProfile);

export default router;
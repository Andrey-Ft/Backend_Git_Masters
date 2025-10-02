import { Router } from 'express';
import { PrismaClient } from "@prisma/client";
import { fetchDashboard } from '../controller/dashboard.controller.js';
import requireAuth from '../../../shared/middlewares/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// Middleware para bypass de autenticación en Postman con una API Key
async function testBypassAuth(req, res, next) {
  const key = req.header('X-API-Key');
  if (process.env.TEST_API_KEY && key === process.env.TEST_API_KEY) {
    const testUser = await prisma.user.findUnique({
      where: { username: "Andrey-Ft" } // Asegúrate que sea tu usuario para pruebas
    });
    if (testUser) {
      req.user = testUser;
      return next();
    }
  }
  return requireAuth(req, res, next);
}

// @route   GET /dashboard
router.get('/', testBypassAuth, fetchDashboard);

export default router;


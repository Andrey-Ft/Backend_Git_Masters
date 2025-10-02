import { Router } from 'express';
import { PrismaClient } from "@prisma/client";
import { 
  listTeams, 
  createNewTeam,
  getTeamDetails,
  joinTeamById,
  leaveCurrentTeam
} from '../controller/teams.controller.js';
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

// --- RUTAS PÚBLICAS ---
router.get('/', listTeams);
router.get('/:id', getTeamDetails);

// --- RUTAS PRIVADAS (ahora usan el bypass para pruebas) ---
router.post('/', testBypassAuth, createNewTeam);
router.post('/:id/join', testBypassAuth, joinTeamById);
router.post('/leave', testBypassAuth, leaveCurrentTeam);

export default router;
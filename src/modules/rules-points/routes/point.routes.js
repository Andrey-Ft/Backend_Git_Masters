// RUTA: src/modules/rules-points/routes/point.routes.js

import express from 'express';
import { getDashboardForLoggedUser, getTopUsersLeaderboard } from '../controller/point.controller.js';
import requireAuth from '../../../shared/middlewares/auth.middleware.js'; // Ajusta la ruta si es necesario

const router = express.Router();

// Ruta protegida para que un usuario vea su propio dashboard
router.get('/me', requireAuth, getDashboardForLoggedUser);

// Ruta pública para ver el ranking
router.get('/leaderboard', getTopUsersLeaderboard);

export default router;
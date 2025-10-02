import { Router } from 'express';
import { getLeaderboard } from '../controller/leaderboard.controller.js';

const router = Router();

// GET /leaderboard -> Devuelve el Top 10 de usuarios
router.get('/', getLeaderboard);

export default router;
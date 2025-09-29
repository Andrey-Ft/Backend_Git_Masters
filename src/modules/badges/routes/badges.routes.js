import { Router } from 'express';
import { getAllBadges, getUserBadges } from '../controller/badges.controller.js';

const router = Router();

// --- RUTAS DE INSIGNIAS ---

/**
 * @route   GET /badges
 * @desc    Obtiene una lista de todas las insignias disponibles en el sistema.
 * @access  Público
 */
router.get('/', getAllBadges);

/**
 * @route   GET /badges/user/:username
 * @desc    Obtiene las insignias ganadas por un usuario específico.
 * @access  Público (o protegido si se requiere autenticación)
 */
router.get('/user/:username', getUserBadges);

export default router;

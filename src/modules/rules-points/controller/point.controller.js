// RUTA: src/modules/rules-points/controller/point.controller.js

import { getDashboardData, getLeaderboard } from '../service/point.service.js';

/**
 * Obtiene los datos del dashboard para el usuario actualmente autenticado.
 */
export const getDashboardForLoggedUser = async (req, res) => {
  try {
    // req.user.id es provisto por el middleware de autenticación
    const dashboardData = await getDashboardData(req.user.id);

    if (!dashboardData) {
      return res.status(404).json({ message: 'Perfil de usuario no encontrado.' });
    }

    res.status(200).json(dashboardData);
  } catch (error) {
    console.error('[PointController] Error al obtener datos del dashboard:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

/**
 * Obtiene el ranking de los mejores usuarios.
 */
export const getTopUsersLeaderboard = async (req, res) => {
  try {
    const leaderboard = await getLeaderboard();
    res.status(200).json(leaderboard);
  } catch (error) {
    console.error('[PointController] Error al obtener el leaderboard:', error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};
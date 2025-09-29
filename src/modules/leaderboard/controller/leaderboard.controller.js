import { getTopUsers } from '../service/leaderboard.service.js';

export const getLeaderboard = async (req, res) => {
  try {
    const leaderboardData = await getTopUsers();
    res.status(200).json(leaderboardData);
  } catch (error) {
    console.error("Error al obtener el leaderboard:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
import { getDashboardData } from '../service/dashboard.service.js';

export const fetchDashboard = async (req, res) => {
  try {
    const userId = req.user.id;
    const dashboardData = await getDashboardData(userId);
    res.status(200).json(dashboardData);
  } catch (error) {
    console.error("Error al obtener los datos del dashboard:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
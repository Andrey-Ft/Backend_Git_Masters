import { 
  getProfileByUserId, 
  updateProfile,
  getActivityLogByUserId,
  getPointsHistoryByUserId
} from "../service/profile.service.js";

/**
 * @description Manejador para obtener el perfil del usuario autenticado.
 */
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; 
    
    const userProfile = await getProfileByUserId(userId);

    if (!userProfile) {
      return res.status(44).json({ message: "Perfil no encontrado." });
    }

    res.status(200).json(userProfile);
  } catch (error) {
    console.error("Error al obtener el perfil:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * @description Manejador para actualizar el perfil del usuario autenticado.
 */
export const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const dataToUpdate = req.body;

        if (!dataToUpdate || typeof dataToUpdate.bio === 'undefined') {
            return res.status(400).json({ message: "El campo 'bio' es requerido." });
        }

        const updatedProfile = await updateProfile(userId, dataToUpdate);
        
        res.status(200).json({ 
            message: "Biografía actualizada con éxito.", 
            bio: updatedProfile.bio 
        });
    
    } catch (error) {
        console.error("Error al actualizar el perfil:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
};

// --- NUEVOS MANEJADORES PARA EL HISTORIAL ---

/**
 * @description Manejador para obtener la actividad de un usuario.
 */
export const getUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const activity = await getActivityLogByUserId(userId);
    res.status(200).json(activity);
  } catch (error) {
    console.error("Error al obtener la actividad del usuario:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};

/**
 * @description Manejador para obtener el historial de puntos de un usuario.
 */
export const getUserPointsHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await getPointsHistoryByUserId(userId);
    res.status(200).json(history);
  } catch (error) { // <-- AQUÍ FALTABAN LAS LLAVES
    console.error("Error al obtener historial de puntos:", error);
    res.status(500).json({ message: "Error interno del servidor." });
  }
};
import { getProfileByUserId, updateProfile } from "../service/profile.service.js";

/**
 * @description Manejador para obtener el perfil del usuario autenticado.
 */
export const getUserProfile = async (req, res) => {
  try {
    // El ID viene del token JWT que ya fue verificado por el middleware 'requireAuth'
    const userId = req.user.id; 
    
    const userProfile = await getProfileByUserId(userId);

    if (!userProfile) {
      return res.status(404).json({ message: "Perfil no encontrado." });
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

        // Validación básica del body
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
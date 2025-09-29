import prisma from '../../../config/prisma.js';

/**
 * Obtiene todas las insignias disponibles en el sistema.
 * Útil para que el frontend pueda mostrar una lista de todas las insignias posibles.
 */
export const getAllBadges = async (req, res) => {
  try {
    const badges = await prisma.badge.findMany({
      select: {
        key: true,
        name: true,
        description: true,
      }
    });
    res.status(200).json(badges);
  } catch (error) {
    console.error('[Badges Controller] Error al obtener las insignias:', error);
    res.status(500).json({ message: 'Error interno del servidor al obtener insignias.' });
  }
};

/**
 * Obtiene las insignias que ha ganado un usuario específico.
 */
export const getUserBadges = async (req, res) => {
  const { username } = req.params;
  try {
    const userWithBadges = await prisma.user.findUnique({
      where: { username },
      select: {
        assignedBadges: {
          orderBy: {
            obtainedAt: 'desc'
          },
          select: {
            obtainedAt: true,
            badge: {
              select: {
                key: true,
                name: true,
                description: true,
              }
            }
          }
        }
      }
    });

    if (!userWithBadges) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    // Mapeamos para aplanar la estructura y que sea más fácil de consumir en el frontend
    const earnedBadges = userWithBadges.assignedBadges.map(ub => ({
      ...ub.badge,
      obtainedAt: ub.obtainedAt,
    }));

    res.status(200).json(earnedBadges);
  } catch (error) {
    console.error(`[Badges Controller] Error al obtener las insignias para ${username}:`, error);
    res.status(500).json({ message: 'Error interno del servidor.' });
  }
};

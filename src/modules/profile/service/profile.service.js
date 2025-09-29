import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * @description Obtiene el perfil completo de un usuario por su ID de la base de datos.
 * @param {string} userId - El ID interno del usuario (CUID).
 * @returns {Promise<object|null>} Un objeto con el perfil completo o null si no se encuentra.
 */
export const getProfileByUserId = async (userId) => {
  const userProfile = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    // Seleccionamos cuidadosamente los datos que enviaremos al frontend
    select: {
      id: true,
      githubId: true,
      username: true,
      email: true, // <--- AÑADIDO
      avatarUrl: true,
      role: true,
      pointsBalance: true, // Tus webhooks ya llenan esto, aquí solo lo leemos
      createdAt: true,
      profile: {
        select: {
          level: true,
          bio: true,
        },
      },
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      assignedBadges: {
        orderBy: { // Ordenamos las insignias por fecha de obtención
          obtainedAt: 'desc',
        },
        select: {
          obtainedAt: true,
          badge: {
            select: {
              name: true,
              description: true,
            },
          },
        },
      },
    },
  });

  if (!userProfile) {
    return null;
  }
  
  // Aplanamos y limpiamos la respuesta para que el frontend la use más fácil
  return {
    id: userProfile.id,
    githubId: userProfile.githubId,
    username: userProfile.username,
    avatarUrl: userProfile.avatarUrl,
    email: userProfile.email, // <--- AÑADIDO
    role: userProfile.role,
    points: userProfile.pointsBalance,
    memberSince: userProfile.createdAt,
    level: userProfile.profile?.level ?? 1,
    bio: userProfile.profile?.bio ?? 'Aún no has escrito una biografía.',
    team: userProfile.team,
    badges: userProfile.assignedBadges.map(b => ({
        name: b.badge.name,
        description: b.badge.description,
        obtainedAt: b.obtainedAt
    }))
  };
};

/**
 * @description Actualiza la biografía del perfil de un usuario.
 * @param {string} userId - El ID del usuario a actualizar.
 * @param {object} data - Los datos a actualizar. Solo se procesará el campo 'bio'.
 * @returns {Promise<object>} El perfil con la biografía actualizada.
 */
export const updateProfile = async (userId, data) => {
  const { bio } = data;

  // Nos aseguramos de que solo se pueda actualizar el 'bio' desde aquí.
  if (typeof bio === 'undefined') {
      throw new Error("El campo 'bio' es requerido para la actualización.");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      profile: {
        // 'upsert' es perfecto aquí:
        // - Si el usuario no tiene perfil, lo CREA con el nuevo bio.
        // - Si ya tiene perfil, lo ACTUALIZA con el nuevo bio.
        upsert: {
          create: { bio },
          update: { bio },
        },
      },
    },
    select: { // Devolvemos solo lo necesario para confirmar el cambio
      id: true,
      profile: {
        select: {
          bio: true,
        },
      },
    }
  });

  return updatedUser.profile;
};
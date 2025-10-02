// RUTA: src/modules/rules-points/service/point.service.js

import prisma from '../../../config/prisma.js';

/**
 * Otorga o deduce puntos a un usuario de forma transaccional.
 */
export const applyPoints = async ({
  userId,
  points,
  ruleKey,
  entityId,
  ruleVersion = 'v1.0',
  notes,
  isReversible = true,
}) => {
  if (points === 0) return null;

  try {
    const [ledgerEntry] = await prisma.$transaction([
      prisma.pointLedger.create({
        data: {
          userId,
          points,
          ruleKey,
          entityId,
          ruleVersion,
          notes,
          isReversible,
        },
      }),
      prisma.user.update({
        where: { id: userId },
        data: {
          pointsBalance: {
            increment: points,
          },
        },
      }),
    ]);

    console.log(`[PointService] ${points} pts aplicados al usuario ${userId} por regla ${ruleKey}.`);
    return ledgerEntry;
  } catch (error) {
    console.error(`[PointService] Falló la transacción de puntos para el usuario ${userId}:`, error);
    throw error;
  }
};

/**
 * Obtiene los datos del dashboard para un usuario específico.
 * @param {string} userId - El ID del usuario.
 * @returns {Promise<object|null>} Los datos del perfil o null si no se encuentra.
 */
export const getDashboardData = async (userId) => {
  const userProfile = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      username: true,
      avatarUrl: true,
      pointsBalance: true,
      createdAt: true,
      profile: {
        select: { level: true },
      },
      assignedBadges: {
        select: {
          badge: {
            select: { name: true, description: true },
          },
          obtainedAt: true,
        },
        orderBy: {
          obtainedAt: 'desc',
        },
      },
      pointLedgerEntries: {
        take: 10, // Obtener las últimas 10 transacciones de puntos
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          points: true,
          notes: true,
          createdAt: true,
        },
      },
    },
  });

  if (!userProfile) {
    return null;
  }

  // Formateamos las insignias para que sean más fáciles de usar en el frontend
  const badges = userProfile.assignedBadges.map(ab => ({
    name: ab.badge.name,
    description: ab.badge.description,
    obtainedAt: ab.obtainedAt,
  }));

  return {
    username: userProfile.username,
    avatarUrl: userProfile.avatarUrl,
    memberSince: userProfile.createdAt,
    totalPoints: userProfile.pointsBalance,
    level: userProfile.profile?.level || 1,
    recentActivity: userProfile.pointLedgerEntries,
    badges: badges,
  };
};

/**
 * Obtiene los 10 usuarios con más puntos para el ranking.
 * @returns {Promise<Array>} Una lista de los mejores usuarios.
 */
export const getLeaderboard = async () => {
  const topUsers = await prisma.user.findMany({
    take: 10,
    orderBy: {
      pointsBalance: 'desc',
    },
    select: {
      username: true,
      avatarUrl: true,
      pointsBalance: true,
      profile: {
        select: { level: true },
      },
    },
  });

  return topUsers.map(user => ({
    username: user.username,
    avatarUrl: user.avatarUrl,
    totalPoints: user.pointsBalance,
    level: user.profile?.level || 1,
  }));
};
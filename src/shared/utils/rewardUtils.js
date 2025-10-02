import prisma from '../../config/prisma.js';

export const updatePoints = async (userId, points) => {
  await prisma.metric.update({
    where: { userId },
    data: {
      points: {
        increment: points
      }
    }
  });
};

export const assignBadge = async (userId, badgeName) => {
  const badge = await prisma.badge.findFirst({ where: { name: badgeName } });
  if (!badge) return;

  await prisma.badgeAssignment.create({
    data: {
      userId,
      badgeId: badge.id
    }
  });
};

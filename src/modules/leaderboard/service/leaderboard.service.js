// En: src/modules/leaderboard/service/leaderboard.service.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const getTopUsers = async () => {
  const topUsers = await prisma.user.findMany({
    // Ordena los usuarios por puntos de mayor a menor
    orderBy: {
      pointsBalance: 'desc',
    },
    // Limita los resultados al Top 10 (puedes cambiar este número)
    take: 10,
    // Selecciona solo los datos que queremos mostrar públicamente
    select: {
      id: true,
      username: true,
      avatarUrl: true,
      pointsBalance: true,
      profile: {
        select: {
          level: true,
        },
      },
    },
  });

  // Mapeamos para aplanar la respuesta y hacerla más fácil de usar en el front
  return topUsers.map(user => ({
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl,
    points: user.pointsBalance,
    level: user.profile?.level ?? 1
  }));
};
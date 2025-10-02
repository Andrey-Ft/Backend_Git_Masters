// En: src/modules/leaderboard/service/leaderboard.service.js
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/**
 * --- NUEVO COMENTARIO ---
 * @description Obtiene el top 10 de usuarios con más puntos desde la base de datos,
 * formatea la respuesta para que sea más sencilla de consumir en el cliente.
 * @returns {Promise<Array<object>>} Una promesa que resuelve a un array de objetos,
 * donde cada objeto es un usuario con su id, username, avatar, puntos y nivel.
 */
export const getTopUsers = async () => {
  const topUsers = await prisma.user.findMany({
    // Ordena los usuarios por puntos de mayor a menor
    orderBy: {
      pointsBalance: 'desc',
    },
    // Limita los resultados al Top 10
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
    /**
     * --- NUEVO COMENTARIO ---
     * Se usa el operador de encadenamiento opcional (?.) por si un usuario no tuviera perfil
     * y el operador de coalescencia nula (??) para asignar un nivel por defecto de 1 si el nivel es null o undefined.
     */
    level: user.profile?.level ?? 1
  }));
};
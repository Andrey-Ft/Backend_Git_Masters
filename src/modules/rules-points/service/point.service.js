// RUTA: src/modules/gamification/services/point.service.js

import prisma from '../../../config/prisma.js';

/**
 * Otorga o deduce puntos a un usuario de forma transaccional.
 * Esta es la única función que debe escribir en el PointLedger y actualizar balances.
 * @param {object} data - Datos para la transacción.
 * @param {string} data.userId - ID del usuario.
 * @param {number} data.points - Puntos a otorgar (puede ser negativo).
 * @param {string} data.ruleKey - Identificador de la regla (ej: "commit.valid_message").
 * @param {string} data.entityId - ID del objeto relacionado (commit SHA, PR número, etc.).
 * @param {string} [data.ruleVersion='v1.0'] - Versión de la regla.
 * @param {string} [data.notes] - Detalles sobre el cálculo.
 * @param {boolean} [data.isReversible=true] - Si la transacción puede ser revertida.
 * @returns {Promise<object | null>} La entrada creada en el libro mayor o null si no se aplicaron puntos.
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
  // No crear entradas en el libro mayor para 0 puntos
  if (points === 0) return null;

  try {
    // Usamos una transacción para garantizar que ambas operaciones (crear y actualizar)
    // se completen con éxito o fallen juntas.
    const [ledgerEntry] = await prisma.$transaction([
      // 1. Crear la entrada en el libro mayor (el registro histórico)
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
      // 2. Actualizar el balance total de puntos del usuario
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
    // Propagamos el error para que el motor de reglas lo maneje
    throw error;
  }
};
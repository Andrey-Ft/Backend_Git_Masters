// RUTA: src/modules/rules-points/service/webhookEvent.service.js

import prisma from '../../../config/prisma.js';

/**
 * Guarda un evento de GitHub en la base de datos.
 */
export const saveGithubEvent = async (record) => {
  try {
    const savedEvent = await prisma.githubEvent.create({
      data: record
    });
    console.info(`Webhook almacenado en DB: delivery=${record.deliveryId} id=${savedEvent.id}`);
    return savedEvent;
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('deliveryId')) {
      console.info(`Webhook duplicado (ya existe en DB): delivery=${record.deliveryId}`);
      return prisma.githubEvent.findUnique({
        where: { deliveryId: record.deliveryId },
      });
    }
    throw error;
  }
};
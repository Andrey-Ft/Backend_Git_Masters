// RUTA: src/modules/reglas-puntos/service/webhookEvent.service.js
import prisma from '../../../config/prisma.js'; // Usamos tu cliente centralizado

/**
 * Guarda un evento de GitHub en la base de datos.
 * Maneja la idempotencia verificando el delivery_id.
 */
export const saveGithubEvent = async (record) => {
  try {
    const savedEvent = await prisma.GithubEvent.create({
      data: record
    });
    console.info(`Webhook almacenado en DB: delivery=${record.delivery_id} id=${savedEvent.id}`);
    return savedEvent;
  } catch (error) {
    if (error.code === 'P2002' && error.meta?.target?.includes('delivery_id')) {
      console.info(`Webhook duplicado (ya existe en DB): delivery=${record.delivery_id}`);
      return prisma.GithubEvent.findUnique({
        where: { delivery_id: record.delivery_id },
      });
    }
    throw error;
  }
};
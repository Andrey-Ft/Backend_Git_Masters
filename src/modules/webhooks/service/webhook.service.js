import prisma from '../../../config/prisma.js';
import { runRulesForActivity } from '../../rules-points/engine/ruleEngine.js';

export const processGitHubEvent = async (payload, deliveryId, eventType) => {
  // 1. Manejo especial para el evento 'ping'
  if (eventType === 'ping') {
    console.log(`[Webhook Service] Ping de GitHub (${deliveryId}) recibido.`);
    return; // <-- CLAVE: No se retorna ningún objeto, solo termina la ejecución.
  }

  // 2. Extraer información y buscar al usuario
  const senderLogin = payload.sender?.login || payload.pusher?.name || null;
  const user = await prisma.user.findUnique({
    where: { username: senderLogin },
  });

  // 3. Si el usuario no existe, se registra y se detiene el proceso.
  if (!user) {
    console.warn(`[Webhook Service] Usuario '${senderLogin}' no encontrado. Ignorando evento.`);
    return; // <-- CLAVE: Se detiene para no procesar eventos de usuarios desconocidos.
  }

  // 4. Construir el registro del evento
  const record = {
    deliveryId: deliveryId,
    eventType: eventType,
    action: payload.action || null,
    repoFullName: payload.repository?.full_name || null,
    senderLogin: senderLogin,
    payload: payload,
  };

  // 5. Intentar guardar el evento y crear el log de actividad
  try {
    const savedEvent = await prisma.githubEvent.create({ data: record });
    console.info(`[Webhook Service] Evento guardado: delivery=${savedEvent.deliveryId}`);

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: eventType,
        metadata: { action: record.action, repo: record.repoFullName },
      },
    });
    console.info(`[Webhook Service] ActivityLog creado para: ${user.username}`);

    // Ejecutar reglas de puntos en segundo plano
    runRulesForActivity(savedEvent.deliveryId).catch(err => {
      console.error(`Error en ruleEngine para delivery ${deliveryId}:`, err);
    });

    // <-- CLAVE: Ya no hay un 'return' al final del try. La función termina.

  } catch (err) {
    // Manejo de eventos duplicados
    if (err.code === 'P2002' && err.meta?.target?.includes('deliveryId')) {
      console.warn(`[Webhook Service] Webhook duplicado ignorado: ${deliveryId}`);
      return; // <-- CLAVE: Tampoco se retorna objeto aquí.
    }
    // Para cualquier otro error, se relanza para que lo capture el sistema
    throw err;
  }
};
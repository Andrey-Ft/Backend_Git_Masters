import prisma from '../../../config/prisma.js';
import { runRulesForActivity } from '../../reglas-puntos/engine/ruleEngine.js'; 

export const handleGitHubWebhook = async (req, res) => {
  const deliveryId = req.headers['x-github-delivery'];

  try {
    const githubEvent = req.headers['x-github-event'];
    const payload = req.body;

    if (githubEvent === 'ping') {
      return res.status(200).send('Ping recibido.');
    }

    if (!githubEvent || !deliveryId) {
      return res.status(400).json({ error: 'Faltan headers requeridos.' });
    }

    const repoFullName = payload?.repository?.full_name || null;
    const senderLogin = payload?.sender?.login || payload?.pusher?.name || null;

    // ✅ Objeto 'record' ajustado a los campos del modelo 'github_events'
    const record = {
      delivery_id: deliveryId,
      event_type: githubEvent,
      repo_full_name: repoFullName,
      sender_login: senderLogin,
      action: payload?.action || null,
      payload: payload,
    };

    // ✅ Usa el modelo correcto: 'prisma.github_events'
    const savedEvent = await prisma.github_events.create({
      data: record,
    });

    console.info(`[Webhook] Evento guardado: delivery=${savedEvent.delivery_id}`);

    // ✅ Dispara el motor de reglas en segundo plano
    runRulesForActivity(savedEvent.delivery_id).catch(err => {
      console.error(`[Webhook] Error en procesamiento asíncrono:`, err);
    });

    return res.status(202).send('Webhook aceptado para procesamiento.');

  } catch (err) {
    // ✅ Actualiza el chequeo de error para el campo correcto 'delivery_id'
    if (err.code === 'P2002' && err.meta?.target?.includes('delivery_id')) {
      console.warn(`[Webhook] Webhook duplicado (delivery_id ya existe): ${deliveryId}`);
      return res.status(200).send('Webhook duplicado, ignorado.');
    }

    console.error(`Error al manejar webhook (deliveryId: ${deliveryId}):`, err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
  // ✅ El bloque 'finally' con prisma.$disconnect() ha sido eliminado.
};
import { processGitHubEvent } from '../service/webhook.service.js';

// La función ya no necesita ser 'async' porque no usamos 'await'
export const handleGitHubWebhook = (req, res) => {
  const deliveryId = req.headers['x-github-delivery'];
  const eventType = req.headers['x-github-event'];
  const payload = req.body;

  // 1. Validación de headers
  if (!deliveryId || !eventType) {
    return res.status(400).json({ error: 'Faltan headers requeridos.' });
  }

  // 2. Manejo especial para 'ping'
  // Si es un ping, se responde 200 y la función termina aquí.
  if (eventType === 'ping') {
    console.log(`Ping de GitHub recibido (${deliveryId}).`);
    return res.status(200).send('Ping recibido.');
  }

  // 3. Respuesta inmediata para todos los demás eventos
  // Le decimos a GitHub "Recibido, gracias" para evitar timeouts.
  res.status(202).send('Webhook aceptado para procesamiento.');

  // 4. Iniciar el procesamiento pesado en segundo plano
  // Se llama al servicio sin 'await' y se le añade un .catch
  // para registrar cualquier error que ocurra durante el proceso.
  processGitHubEvent(payload, deliveryId, eventType).catch(err => {
    console.error(`Error en el procesamiento en segundo plano (delivery: ${deliveryId}):`, err);
  });
};
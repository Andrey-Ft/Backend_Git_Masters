// RUTA: src/shared/middlewares/githubWebhookVerifier.js
import crypto from 'crypto';

const verifyGitHubSignature = (req, res, next) => {
  // express.raw guardó el buffer en req.body
  if (!req.body || req.body.length === 0) {
    return next(new Error('Request body is empty. Make sure express.raw() is used.'));
  }

  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  if (!secret) {
    console.error('[Verifier] GITHUB_WEBHOOK_SECRET no está configurado.');
    return res.status(500).send('Server configuration error.');
  }

  const signature = req.headers['x-hub-signature-256'];
  if (!signature) {
    return res.status(401).send('Unauthorized: No signature provided.');
  }

  const hash = `sha256=${crypto.createHmac('sha256', secret).update(req.body).digest('hex')}`;

  // Usar crypto.timingSafeEqual para prevenir ataques de temporización
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash))) {
    console.warn('[Verifier] Petición no autorizada: la firma no coincide.');
    return res.status(401).send('Unauthorized: Invalid signature.');
  }

  // Si la firma es válida, ahora sí parseamos el JSON para los siguientes pasos
  req.body = JSON.parse(req.body.toString());
  next();
};

export default verifyGitHubSignature;
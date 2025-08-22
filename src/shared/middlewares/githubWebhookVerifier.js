// RUTA: src/shared/middlewares/verifyGitHubSignature.js

import crypto from 'crypto';

const verifyGitHubSignature = (req, res, next) => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!secret) {
        console.error('GITHUB_WEBHOOK_SECRET no está configurado.');
        return res.status(500).send('Error de configuración del servidor.');
    }

    const signature = req.headers['x-hub-signature-256'];

    if (!signature) {
        return res.status(401).send('Firma de webhook faltante.');
    }

    // Gracias a express.raw(), req.body ahora es un Buffer con el payload crudo.
    const payload = req.body;

    // Verificamos que el payload exista y sea un Buffer
    if (!payload || !Buffer.isBuffer(payload)) {
        return res.status(500).send('Error interno: El cuerpo de la petición no es un Buffer.');
    }

    // Calcula el hash esperado usando el secreto y el payload
    const hmac = crypto.createHmac('sha256', secret);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    // Compara la firma calculada con la firma recibida de GitHub de forma segura
    const signatureBuffer = Buffer.from(signature, 'utf8');
    const digestBuffer = Buffer.from(digest, 'utf8');

    if (signatureBuffer.length !== digestBuffer.length || !crypto.timingSafeEqual(signatureBuffer, digestBuffer)) {
        console.warn('Firma de webhook no válida. Petición rechazada.');
        return res.status(403).send('Firma de webhook no válida.');
    }

    // Si la firma es válida, parseamos el JSON del buffer para el siguiente middleware
    try {
      req.body = JSON.parse(payload.toString('utf8'));
    } catch (e) {
      return res.status(400).send('Payload inválido: No se pudo parsear el JSON.');
    }

    next();
};

export default verifyGitHubSignature;
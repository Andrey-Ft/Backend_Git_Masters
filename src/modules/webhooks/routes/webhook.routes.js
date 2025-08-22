// RUTA: src/modules/webhooks/routes/webhook.routes.js
import express from 'express';

import { handleGitHubWebhook } from '../controller/webhook.controller.js';
import verifyGitHubSignature from '../../../shared/middlewares/githubWebhookVerifier.js';

const router = express.Router();

/**
 * @route POST /webhooks/github
 */

router.post('/github', verifyGitHubSignature, handleGitHubWebhook);

export default router;
// RUTA: src/modules/gamification/engine/ruleEngine.js

import prisma from '../../../config/prisma.js';
import { processCommitRule } from './rules/commit.rule.js';
import { processProtectedBranchRule } from './rules/branch.rule.js';
import { processPullRequestRule } from './rules/pr.rule.js';
import { processReviewRule } from './rules/review.rule.js';   

/**
 * Orquesta la ejecución de todas las reglas relevantes para un evento.
 */
export const runRulesForActivity = async (deliveryId) => {
  const event = await prisma.github_events.findUnique({ where: { delivery_id: deliveryId } });
  if (!event || event.processed_status !== 'stored') {
    return;
  }
  
  await prisma.github_events.update({
      where: { id: event.id },
      data: { processed_status: 'processing' },
  });

  const user = await prisma.user.findUnique({ where: { username: event.sender_login }});
  if (!user) {
    await prisma.github_events.update({ where: { id: event.id }, data: { processed_status: 'failed_user_not_found' } });
    console.warn(`[RuleEngine] Usuario no encontrado: ${event.sender_login}`);
    return;
  }
  
  console.log(`[RuleEngine] Iniciando evaluación para evento ${event.event_type} del usuario ${user.username}`);

  try {
    // Ejecutar todas las reglas aplicables en orden
    switch (event.event_type) {
      case 'push':
        await processCommitRule(event, user);
        await processProtectedBranchRule(event, user);
        break;

      case 'pull_request':
        // ✅ Descomentado y activado
        await processPullRequestRule(event, user);
        break;

      case 'pull_request_review':
        // ✅ Descomentado y activado
        await processReviewRule(event, user);
        break;
    }

    await prisma.github_events.update({
        where: { id: event.id },
        data: { processed_status: 'processed_ok' },
    });
    console.log(`[RuleEngine] Evaluación completada para ${deliveryId}`);

  } catch (error) {
    console.error(`[RuleEngine] Error procesando evento ${deliveryId}:`, error);
    await prisma.github_events.update({ where: { id: event.id }, data: { processed_status: 'failed_rule_error' } });
  }
};
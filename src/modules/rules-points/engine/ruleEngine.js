// RUTA: src/modules/rules-points/engine/ruleEngine.js

import prisma from '../../../config/prisma.js';
import { processCommitRule } from './rules/commit.rule.js';
import { processBranchRule } from './rules/branch.rule.js';
import { processPullRequestRule } from './rules/pr.rule.js';
import { processReviewRule } from './rules/review.rule.js';
import { processOtherEventsRule } from './rules/other.rule.js';

/**
 * Orquesta la ejecución de todas las reglas relevantes para un evento.
 */
export const runRulesForActivity = async (deliveryId) => {
  const event = await prisma.GithubEvent.findUnique({ where: { deliveryId: deliveryId } });
  if (!event || event.processedStatus !== 'stored') {
    return;
  }
  
  await prisma.GithubEvent.update({
      where: { id: event.id },
      data: { processedStatus: 'processing' },
  });

  const user = await prisma.user.findUnique({ where: { username: event.senderLogin }});
  if (!user) {
    await prisma.GithubEvent.update({ where: { id: event.id }, data: { processedStatus: 'failed_user_not_found' } });
    console.warn(`[RuleEngine] Usuario no encontrado: ${event.senderLogin}`);
    return;
  }
  
  console.log(`[RuleEngine] Iniciando evaluación para evento ${event.eventType} del usuario ${user.username}`);

  try {
    // Ejecutar todas las reglas aplicables en orden
    switch (event.eventType) {
      case 'push':
        await processCommitRule(event, user);
        await processBranchRule(event, user);
        break;

      case 'pull_request':
        await processPullRequestRule(event, user);
        break;

      case 'pull_request_review':
        await processReviewRule(event, user);
        break;
        
      case 'create':
        await processBranchRule(event, user);
        break;

      case 'delete':
        await processBranchRule(event, user);
        break;

      case 'release':
        await processOtherEventsRule(event, user);
        break;
    }

    await prisma.GithubEvent.update({
        where: { id: event.id },
        data: { processedStatus: 'processed_ok' },
    });
    console.log(`[RuleEngine] Evaluación completada para ${deliveryId}`);

  } catch (error) {
    console.error(`[RuleEngine] Error procesando evento ${deliveryId}:`, error);
    await prisma.GithubEvent.update({ where: { id: event.id }, data: { processedStatus: 'failed_rule_error' } });
  }
};
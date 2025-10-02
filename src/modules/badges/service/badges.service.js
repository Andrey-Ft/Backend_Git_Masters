import prisma from '../../../config/prisma.js';
import { subDays, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { applyPoints } from '../../rules-points/service/point.service.js';

// --- LÓGICA DE EVALUACIÓN PARA CADA INSIGNIA ---

// NUEVA FUNCIÓN HELPER OPTIMIZADA
/**
 * Cuenta las correcciones válidas para un conjunto de comentarios de revisión de forma eficiente.
 * @param {Array} reviewComments - Un array de eventos de comentarios de revisión.
 * @returns {Promise<Map<string, number>>} - Un mapa con `senderLogin` como clave y el conteo de correcciones como valor.
 */
async function countCorrectionsInBulk(reviewComments) {
  if (reviewComments.length === 0) return new Map();

  // 1. Recopilar la información necesaria para una única consulta de "pushes"
  const pushQueries = reviewComments.map(comment => ({
    senderLogin: comment.payload?.pull_request?.user?.login,
    branchRef: `refs/heads/${comment.payload?.pull_request?.head?.ref}`,
    after: comment.receivedAt,
  })).filter(q => q.senderLogin && q.branchRef);

  if (pushQueries.length === 0) return new Map();

  // 2. Ejecutar UNA SOLA CONSULTA para obtener todos los pushes relevantes
  const relevantPushes = await prisma.githubEvent.findMany({
    where: {
      eventType: 'push',
      OR: pushQueries.map(q => ({
        senderLogin: q.senderLogin,
        payload: { path: ['ref'], equals: q.branchRef },
        receivedAt: { gt: q.after },
      })),
    },
    select: {
      senderLogin: true,
      receivedAt: true,
      payload: true,
    }
  });

  // 3. Procesar los resultados en memoria para contar las correcciones
  const correctionsByUser = new Map();
  const processedPrUrls = new Set();

  for (const comment of reviewComments) {
    const prUrl = comment.payload?.pull_request?.html_url;
    const reviewer = comment.senderLogin;

    if (!prUrl || processedPrUrls.has(`${reviewer}:${prUrl}`)) continue;

    const prAuthor = comment.payload?.pull_request?.user?.login;
    const branchRef = `refs/heads/${comment.payload?.pull_request?.head?.ref}`;
    
    // Buscar el push en los datos que ya obtuvimos, en lugar de consultar la BD
    const hasSubsequentPush = relevantPushes.some(push =>
      push.senderLogin === prAuthor &&
      push.payload.ref === branchRef &&
      push.receivedAt > comment.receivedAt
    );

    if (hasSubsequentPush) {
      const currentCount = correctionsByUser.get(reviewer) || 0;
      correctionsByUser.set(reviewer, currentCount + 1);
      processedPrUrls.add(`${reviewer}:${prUrl}`);
    }
  }

  return correctionsByUser;
}


async function checkCommitPerfecto(user, badge) {
  // ... (Esta función ya es eficiente, no necesita cambios)
  const criteria = badge.criteria;
  const { durationDays, rules } = criteria;
  const validCommitsRule = rules.find(r => r.metric === 'valid_commits');
  const atomicityRule = rules.find(r => r.metric === 'atomicity_rate');
  const dateLimit = subDays(new Date(), durationDays);
  const ledgers = await prisma.pointLedger.findMany({
    where: { userId: user.id, ruleKey: { startsWith: 'commit.' }, createdAt: { gte: dateLimit } },
  });
  const totalCommits = ledgers.length;
  const validCommits = ledgers.filter(l => l.ruleKey === validCommitsRule.ruleKey).length;
  const atomicCommits = ledgers.filter(l => l.ruleKey === atomicityRule.ruleKey).length;
  const atomicityRate = totalCommits > 0 ? atomicCommits / totalCommits : 0;
  return validCommits >= validCommitsRule.target && atomicityRate >= atomicityRule.target;
}

// REFACTORIZADO para usar el helper optimizado
async function checkRevisorExperto(user, badge) {
  const criteria = badge.criteria;
  const { durationDays, rules } = criteria;
  const reviewsRule = rules.find(r => r.metric === 'total_reviews');
  const correctionsRule = rules.find(r => r.metric === 'valid_corrections');
  const dateLimit = subDays(new Date(), durationDays);

  const totalReviews = await prisma.githubEvent.count({
    where: { senderLogin: user.username, eventType: reviewsRule.eventType, receivedAt: { gte: dateLimit } },
  });
  if (totalReviews < reviewsRule.target) return false;

  const reviewComments = await prisma.githubEvent.findMany({
    where: { senderLogin: user.username, eventType: 'pull_request_review_comment', receivedAt: { gte: dateLimit } },
    select: { senderLogin: true, receivedAt: true, payload: true },
  });

  const correctionsMap = await countCorrectionsInBulk(reviewComments);
  const validCorrections = correctionsMap.get(user.username) || 0;

  return validCorrections >= correctionsRule.target;
}

// REFACTORIZADO para usar el helper optimizado
async function evaluateGuardianDeLaCalidad(badge) {
  console.log('[Badge Service] Evaluando competición mensual: Guardián de la Calidad...');
  const { min_target, points_reward } = badge.criteria;
  
  const lastMonthStart = startOfMonth(subMonths(new Date(), 1));
  const lastMonthEnd = endOfMonth(subMonths(new Date(), 1));

  const allReviewComments = await prisma.githubEvent.findMany({
    where: { eventType: 'pull_request_review_comment', receivedAt: { gte: lastMonthStart, lte: lastMonthEnd } },
    select: { senderLogin: true, receivedAt: true, payload: true },
  });

  const correctionsMap = await countCorrectionsInBulk(allReviewComments);

  let winnerUsername = null;
  let maxCorrections = 0;
  for (const [username, count] of correctionsMap.entries()) {
    if (count > maxCorrections) {
      maxCorrections = count;
      winnerUsername = username;
    }
  }

  if (winnerUsername && maxCorrections >= min_target) {
    const winnerUser = await prisma.user.findUnique({ where: { username: winnerUsername } });
    if (winnerUser) {
      await prisma.userBadge.upsert({
        where: { userId_badgeId: { userId: winnerUser.id, badgeId: badge.id } },
        update: {}, create: { userId: winnerUser.id, badgeId: badge.id },
      });
      await applyPoints({
        userId: winnerUser.id,
        points: points_reward,
        ruleKey: 'badge.reward.guardian_de_la_calidad',
        notes: `+${points_reward} pts por la insignia ${badge.name}.`,
      });
      console.log(`[Badge Service] Insignia mensual '${badge.name}' otorgada a ${winnerUsername}`);
    }
  }
}

// --- ORQUESTADOR (con manejo de errores) ---

const badgeEvaluators = {
  'commit_perfecto': checkCommitPerfecto,
  'revisor_experto': checkRevisorExperto,
};

export const evaluateDailyBadges = async () => {
  console.log('[Badge Service] Iniciando evaluación de insignias diarias...');
  const users = await prisma.user.findMany();
  const dailyBadges = await prisma.badge.findMany({
    where: { key: { in: Object.keys(badgeEvaluators) } },
  });

  for (const user of users) {
    try {
      for (const badge of dailyBadges) {
        const evaluator = badgeEvaluators[badge.key];
        if (evaluator) {
          const userEarnedBadge = await evaluator(user, badge);
          if (userEarnedBadge) {
            await prisma.userBadge.upsert({
              where: { userId_badgeId: { userId: user.id, badgeId: badge.id } },
              update: {}, create: { userId: user.id, badgeId: badge.id },
            });
            console.log(`[Badge Service] Insignia '${badge.name}' otorgada a ${user.username}`);
          }
        }
      }
    } catch (error) {
      console.error(`[Badge Service] Falló la evaluación para el usuario ${user.username}:`, error);
    }
  }
  console.log('[Badge Service] Evaluación diaria completada.');
};

export const evaluateMonthlyBadges = async () => {
  try {
    const guardianBadge = await prisma.badge.findUnique({ where: { key: 'guardian_de_la_calidad' }});
    if (guardianBadge) {
      await evaluateGuardianDeLaCalidad(guardianBadge);
    }
  } catch (error) {
    console.error('[Badge Service] Falló la evaluación de insignias mensuales:', error);
  }
};

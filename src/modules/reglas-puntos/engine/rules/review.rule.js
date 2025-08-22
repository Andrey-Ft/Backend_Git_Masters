// RUTA: src/modules/gamification/engine/rules/review.rule.js

import { applyPoints } from '../../service/point.service.js';

const POINTS = {
  CONSTRUCTIVE_REVIEW: 10,
  VALID_ISSUE_FOUND: 20,
};

/**
 * Evalúa un evento de 'pull_request_review'.
 * @param {object} event - El evento desde la DB.
 * @param {object} reviewer - El usuario que hizo la revisión.
 */
export const processReviewRule = async (event, reviewer) => {
  const payload = event.payload;
  const review = payload.review;
  const pr = payload.pull_request;
  
  // Solo nos interesa cuando se envía una revisión, no cuando se edita o descarta.
  if (payload.action !== 'submitted') {
    return;
  }
  
  let pointsToAward = 0;
  let notes = [];

  // --- Regla 1: Revisión Constructiva (+10 pts) ---
  // Se considera constructiva si aprueba o pide cambios.
  if (review.state === 'approved' || review.state === 'changes_requested') {
    pointsToAward += POINTS.CONSTRUCTIVE_REVIEW;
    notes.push(`Revisión constructiva (${review.state}): +${POINTS.CONSTRUCTIVE_REVIEW} pts.`);
  }

  // --- Regla 2: Bono por Encontrar un Problema Válido (+20 pts) ---
  // Si se pidieron cambios, damos un bono. Se asume que el cambio es válido si el PR
  // eventualmente se mergea, lo que implica que el autor corrigió lo solicitado.
  if (review.state === 'changes_requested') {
    pointsToAward += POINTS.VALID_ISSUE_FOUND;
    notes.push(`Problema válido detectado: +${POINTS.VALID_ISSUE_FOUND} pts.`);
  }
  
  if (pointsToAward > 0) {
    await applyPoints({
      userId: reviewer.id,
      points: pointsToAward,
      ruleKey: 'review.submitted',
      entityId: review.id.toString(),
      notes: `En PR #${pr.number}. ${notes.join(' ')}`,
    });
  }
};
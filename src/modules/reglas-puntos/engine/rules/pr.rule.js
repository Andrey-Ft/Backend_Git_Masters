// RUTA: src/modules/gamification/engine/rules/pr.rule.js

import { applyPoints } from '../../service/point.service.js';
import prisma from '../../../../config/prisma.js';

// --- Constantes de la Regla ---
const POINTS = {
  PR_CREATED: 30,
  PR_MERGED: 80,
  QUALITY_BONUS: 50, // Pasa CI/Linters y no tiene change requests
  RESOLVE_CONFLICTS: 25,
  CHANGE_REQUEST_PENALTY: -10,
};

/**
 * Evalúa un evento de 'pull_request'.
 * @param {object} event - El evento desde la DB.
 * @param {object} user - El autor del PR.
 */
export const processPullRequestRule = async (event, user) => {
  const payload = event.payload;
  const action = payload.action;
  const pr = payload.pull_request;

  // --- Regla 1: PR Creado (+30 pts) ---
  if (action === 'opened') {
    await applyPoints({
      userId: user.id,
      points: POINTS.PR_CREATED,
      ruleKey: 'pr.created',
      entityId: pr.id.toString(),
      notes: `PR #${pr.number} creado.`,
    });
  }

  // --- Reglas de Merge (cuando el PR se cierra y es mergeado) ---
  if (action === 'closed' && pr.merged) {
    const mergerUsername = pr.merged_by.login;
    const merger = await prisma.user.findUnique({ where: { username: mergerUsername } });
    
    // --- Regla 2: PR Mergeado (+80 pts para el autor) ---
    await applyPoints({
      userId: user.id,
      points: POINTS.PR_MERGED,
      ruleKey: 'pr.merged',
      entityId: pr.id.toString(),
      notes: `PR #${pr.number} mergeado por ${mergerUsername}.`,
    });

    // --- Regla 3: Resolver Conflictos (+25 pts para quien hizo el merge) ---
    // Asumimos que quien hace el merge es quien resolvió los conflictos.
    if (merger) {
      await applyPoints({
        userId: merger.id,
        points: POINTS.RESOLVE_CONFLICTS,
        ruleKey: 'pr.resolve_conflicts',
        entityId: pr.id.toString(),
        notes: `Resolvió conflictos y mergeó el PR #${pr.number}.`,
      });
    }

    // --- Regla 4: Bono de Calidad (+50 pts) y Penalizaciones ---
    // NOTA: Esto requiere llamadas a la API de GitHub para obtener información 
    // que no viene en el webhook (status de CI, lista de reviews).
    const hasOpenChangeRequests = false; // TODO: Llamar a la API de GitHub para verificar reviews
    const ciPassed = true; // TODO: Llamar a la API de GitHub para verificar checks

    if (ciPassed && !hasOpenChangeRequests) {
      await applyPoints({
        userId: user.id,
        points: POINTS.QUALITY_BONUS,
        ruleKey: 'pr.quality_bonus',
        entityId: pr.id.toString(),
        notes: `PR #${pr.number} mergeado con alta calidad (CI OK, sin cambios pedidos).`,
      });
    }
  }
};
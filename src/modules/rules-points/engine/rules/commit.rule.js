// RUTA: src/modules/rules-points/engine/rules/commit.rule.js

import { applyPoints } from '../../service/point.service.js';
import prisma from '../../../../config/prisma.js';
import { startOfDay } from 'date-fns';

const VALID_COMMIT_MESSAGE_REGEX = /^(feat|fix|docs|style|refactor|test|chore|improvement)(\(.+\))?: .{5,}/;
const POINTS = { ANY_COMMIT: 5, CONVENTIONAL_BONUS: 8, INCLUDES_TIME: 5 };
const DAILY_CAP = 60;
const ATOMICITY_BASE_POINTS = 5;

/**
 * Procesa un commit de reversión, localiza las entradas de puntos originales
 * y aplica una entrada negativa para anular los puntos.
 * @param {object} commit - El objeto de commit del payload del webhook.
 * @param {object} user - El objeto de usuario que realizó la acción.
 */
const handleRevertCommit = async (commit, user) => {
  const shaMatch = commit.message.match(/This reverts commit ([a-f0-9]{40})\./);
  if (!shaMatch || !shaMatch[1]) return;
  const originalCommitSha = shaMatch[1];
  const originalPointEntries = await prisma.pointLedger.findMany({
    where: { entityId: originalCommitSha, isReversible: true },
  });
  if (originalPointEntries.length === 0) return;
  for (const entry of originalPointEntries) {
    await applyPoints({
      userId: user.id,
      points: -entry.points,
      ruleKey: 'commit.revert',
      entityId: commit.id,
      notes: `-${entry.points} pts por revertir commit ${originalCommitSha.substring(0, 7)}. Anula regla '${entry.ruleKey}'.`,
      isReversible: false,
    });
  }
};

/**
 * Procesa los commits de un evento 'push' para asignar puntos basados en diversas reglas.
 * @param {object} event - El objeto del evento de GitHub almacenado en la base de datos.
 * @param {object} user - El objeto de usuario asociado al evento.
 */
export const processCommitRule = async (event, user) => {
  console.log(`\n--- [CommitRule-DEBUG] --- Iniciando proceso para ${user.username} ---`);

  // Log para inspeccionar el payload de commits recibido.
  console.log('[CommitRule-DEBUG] Payload de commits recibido:', JSON.stringify(event.payload?.commits, null, 2));

  const rawCommits = event.payload?.commits || [];
  const commits = rawCommits.filter(c => {
    // CORRECCIÓN: La lógica ahora maneja correctamente commits sin la propiedad 'parents'.
    // Un commit es válido si no es un merge commit (tiene menos de 2 padres).
    // Si 'parents' no existe, su longitud se considera 0, lo cual es correcto.
    const isDistinct = c.distinct;
    const parentCount = c.parents?.length || 0;
    const isNotMergeCommit = parentCount < 2;
    const result = isDistinct && isNotMergeCommit;
    console.log(`[CommitRule-DEBUG] Evaluando commit ${c.id?.substring(0, 7)}: distinct=${isDistinct}, parentCount=${parentCount} -> Pasa? ${result}`);
    return result;
  });

  // Log para verificar el número de commits que superaron el filtro inicial.
  console.log(`[CommitRule-DEBUG] Commits que pasaron el filtro: ${commits.length}`);
  if (commits.length === 0) {
    console.log('[CommitRule-DEBUG] No hay commits para procesar. Saliendo de la regla.');
    console.log('--- [CommitRule-DEBUG] --- Proceso finalizado ---\n');
    return;
  }

  const dailyPointsResult = await prisma.pointLedger.aggregate({
    _sum: { points: true },
    where: { userId: user.id, ruleKey: { startsWith: 'commit.' }, createdAt: { gte: startOfDay(new Date()) } },
  });
  let currentDailyPoints = dailyPointsResult._sum.points || 0;
  console.log(`[CommitRule-DEBUG] Puntos diarios actuales: ${currentDailyPoints}`);

  for (const commit of commits) {
    console.log(`[CommitRule-DEBUG] Procesando commit: ${commit.id.substring(0, 7)}`);

    if (commit.message.includes('(cherry picked from commit')) {
      console.log(`[CommitRule-DEBUG] Commit ${commit.id.substring(0, 7)} ignorado por ser un cherry-pick.`);
      continue;
    }
    if (commit.message.startsWith('Revert')) {
      await handleRevertCommit(commit, user);
      continue;
    }

    // Regla 0: Puntos base por cualquier commit válido.
    if (currentDailyPoints < DAILY_CAP) {
        const pointsToApply = Math.min(POINTS.ANY_COMMIT, DAILY_CAP - currentDailyPoints);
        console.log(`[CommitRule-DEBUG] Intentando aplicar ${pointsToApply} pts base...`);
        await applyPoints({
            userId: user.id,
            points: pointsToApply,
            ruleKey: 'commit.creation',
            entityId: commit.id,
            notes: `+${pointsToApply} pts por crear commit.`
        });
        currentDailyPoints += pointsToApply;
    }

    // BONO 1: Mensaje de Commit Convencional.
    const isConventional = VALID_COMMIT_MESSAGE_REGEX.test(commit.message);
    console.log(`[CommitRule-DEBUG] Mensaje convencional? ${isConventional}. Mensaje: "${commit.message}"`);
    if (isConventional && currentDailyPoints < DAILY_CAP) {
      const pointsToApply = Math.min(POINTS.CONVENTIONAL_BONUS, DAILY_CAP - currentDailyPoints);
      console.log(`[CommitRule-DEBUG] Intentando aplicar ${pointsToApply} pts de bono convencional...`);
      await applyPoints({
        userId: user.id,
        points: pointsToApply,
        ruleKey: 'commit.conventional',
        entityId: commit.id,
        notes: `+${pointsToApply} pts de BONO por mensaje convencional.`,
      });
      currentDailyPoints += pointsToApply;
    }

    // BONO 2: Atomicidad.
    if (currentDailyPoints < DAILY_CAP) {
      const filesChanged = (commit.added?.length || 0) + (commit.modified?.length || 0);
      const atomicityBonus = Math.max(0, ATOMICITY_BASE_POINTS - Math.floor(filesChanged / 3));
      console.log(`[CommitRule-DEBUG] Bono de atomicidad calculado: ${atomicityBonus} (archivos cambiados: ${filesChanged})`);
      if (atomicityBonus > 0) {
        const pointsToApply = Math.min(atomicityBonus, DAILY_CAP - currentDailyPoints);
        console.log(`[CommitRule-DEBUG] Intentando aplicar ${pointsToApply} pts de bono por atomicidad...`);
        await applyPoints({
          userId: user.id,
          points: pointsToApply,
          ruleKey: 'commit.atomicity_bonus',
          entityId: commit.id,
          notes: `+${pointsToApply} pts de BONO por atomicidad (${filesChanged} archivos).`,
        });
        currentDailyPoints += pointsToApply;
      }
    }
    
    // BONO 3: Inclusión de #time.
    const includesTime = commit.message.includes('#time');
    console.log(`[CommitRule-DEBUG] Incluye #time? ${includesTime}`);
    if (includesTime && currentDailyPoints < DAILY_CAP) {
      const pointsToApply = Math.min(POINTS.INCLUDES_TIME, DAILY_CAP - currentDailyPoints);
       console.log(`[CommitRule-DEBUG] Intentando aplicar ${pointsToApply} pts de bono por #time...`);
       await applyPoints({
          userId: user.id,
          points: pointsToApply,
          ruleKey: 'commit.includes_time',
          entityId: commit.id,
          notes: `+${pointsToApply} pts de BONO por incluir #time.`,
        });
        currentDailyPoints += pointsToApply;
    }

    if (currentDailyPoints >= DAILY_CAP) {
      console.log(`[CommitRule-DEBUG] Límite diario de puntos para commits alcanzado.`);
      break;
    }
  }
  console.log('--- [CommitRule-DEBUG] --- Proceso finalizado ---\n');
};

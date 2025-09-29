// RUTA: src/modules/rules-points/engine/rules/commit.rule.js

import { applyPoints } from '../../service/point.service.js';
import prisma from '../../../../config/prisma.js';
import { startOfDay } from 'date-fns';

const VALID_COMMIT_MESSAGE_REGEX = /^(feat|fix|docs|style|refactor|test|chore|improvement)(\(.+\))?: .{5,}/;
const POINTS = { VALID_MESSAGE: 10, INCLUDES_TIME: 5 };
const DAILY_CAP = 60;
const ATOMICITY_BASE_POINTS = 5;

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

export const processCommitRule = async (event, user) => {
  const commits = event.payload?.commits?.filter(c => c.distinct && !c.message.startsWith('Merge'));
  if (!commits || commits.length === 0) return;

  const dailyPointsResult = await prisma.pointLedger.aggregate({
    _sum: { points: true },
    where: {
      userId: user.id,
      ruleKey: { startsWith: 'commit.' },
      createdAt: { gte: startOfDay(new Date()) },
    },
  });
  let currentDailyPoints = dailyPointsResult._sum.points || 0;

  for (const commit of commits) {
    if (commit.message.startsWith('Revert')) {
      await handleRevertCommit(commit, user);
      continue;
    }

    if (currentDailyPoints >= DAILY_CAP) {
      console.log(`[CommitRule] Usuario ${user.username} ha alcanzado el cap diario de commits.`);
      break;
    }

    let pointsForCommit = 0;
    const notes = [];

    if (VALID_COMMIT_MESSAGE_REGEX.test(commit.message)) {
      pointsForCommit += POINTS.VALID_MESSAGE;
      notes.push(`+${POINTS.VALID_MESSAGE} (mensaje válido)`);
    }
    if (commit.message.includes('#time')) {
      pointsForCommit += POINTS.INCLUDES_TIME;
      notes.push(`+${POINTS.INCLUDES_TIME} (#time)`);
    }
    
    const filesChanged = (commit.added?.length || 0) + (commit.modified?.length || 0);
    const linesChanged = 0; // Omitido por limitación del webhook.

    const atomicityBonus = Math.max(0, ATOMICITY_BASE_POINTS - Math.floor(filesChanged / 3) - Math.floor(linesChanged / 100));

    if (atomicityBonus > 0) {
      pointsForCommit += atomicityBonus;
      notes.push(`+${atomicityBonus} (atomic bonus)`);
    }

    const pointsToApply = Math.min(pointsForCommit, DAILY_CAP - currentDailyPoints);

    if (pointsToApply > 0) {
      await applyPoints({
        userId: user.id,
        points: pointsToApply,
        ruleKey: 'commit.creation',
        entityId: commit.id,
        notes: notes.join(', ') || 'Puntos por commit.',
      });
      currentDailyPoints += pointsToApply;
    }
  }
};
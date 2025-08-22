// RUTA: src/modules/gamification/engine/rules/commit.rule.js

import { applyPoints } from '../../service/point.service.js';
import prisma from '../../../../config/prisma.js';
import { startOfDay } from 'date-fns';

const VALID_COMMIT_MESSAGE_REGEX = /^(feat|fix|docs|style|refactor|test|chore|improvement)(\(.+\))?: .{5,}/;
const POINTS = { VALID_MESSAGE: 10, INCLUDES_TIME: 5 };
const DAILY_CAP = 60;

export const processCommitRule = async (event, user) => {
  const commits = event.payload?.commits?.filter(c => c.distinct && !c.message.startsWith('Merge'));
  if (!commits || commits.length === 0) return;

  const dailyPointsResult = await prisma.pointLedger.aggregate({
    _sum: { points: true },
    where: { userId: user.id, ruleKey: { startsWith: 'commit.' }, createdAt: { gte: startOfDay(new Date()) } },
  });
  let currentDailyPoints = dailyPointsResult._sum.points || 0;

  for (const commit of commits) {
    if (currentDailyPoints >= DAILY_CAP) {
      console.log(`[CommitRule] Usuario ${user.username} ha alcanzado el cap diario de commits.`);
      break;
    }

    let pointsForCommit = 0;
    let notes = [];

    if (VALID_COMMIT_MESSAGE_REGEX.test(commit.message)) {
      pointsForCommit += POINTS.VALID_MESSAGE;
      notes.push(`+${POINTS.VALID_MESSAGE} (mensaje válido)`);
    }
    if (commit.message.includes('#time')) {
      pointsForCommit += POINTS.INCLUDES_TIME;
      notes.push(`+${POINTS.INCLUDES_TIME} (#time)`);
    }
    
    // Aquí iría el cálculo del 'atomicity_bonus'
    const filesChanged = (commit.added?.length || 0) + (commit.modified?.length || 0);
    const atomicityBonus = Math.max(0, 5 - Math.floor(filesChanged / 3));
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
        notes: notes.join(', '),
      });
      currentDailyPoints += pointsToApply;
    }
  }
};
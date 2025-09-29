import { applyPoints } from '../../service/point.service.js';
import prisma from '../../../../config/prisma.js';
import { subDays } from 'date-fns';

const POINTS = {
  PR_CREATED: 30,
  PR_MERGED: 80,
  CONFLICT_RESOLVED: 25,
};
const ABUSE_PROTECTION_DAYS = 30;

const handlePrOpened = async (pr, author) => {
  const existingCreationPoints = await prisma.pointLedger.findFirst({
    where: {
      ruleKey: 'pr.creation',
      entityId: pr.head.ref,
      createdAt: { gte: subDays(new Date(), ABUSE_PROTECTION_DAYS) },
    },
  });

  if (existingCreationPoints) return;
  
  const hasChecklist = /-\s\[[\s|x]\]/.test(pr.body || '');
  if (!hasChecklist) return;

  await applyPoints({
    userId: author.id,
    points: POINTS.PR_CREATED,
    ruleKey: 'pr.creation',
    entityId: pr.head.ref,
    notes: `+${POINTS.PR_CREATED} pts por crear el PR #${pr.number} con checklist.`,
  });
};

const handlePrMerged = async (pr, author) => {
  const existingMergePoints = await prisma.pointLedger.findFirst({
    where: {
      ruleKey: 'pr.merge',
      entityId: pr.head.ref,
      createdAt: { gte: subDays(new Date(), ABUSE_PROTECTION_DAYS) },
    },
  });

  if (!existingMergePoints) {
    await applyPoints({
      userId: author.id,
      points: POINTS.PR_MERGED,
      ruleKey: 'pr.merge',
      entityId: pr.head.ref,
      notes: `+${POINTS.PR_MERGED} pts por el merge del PR #${pr.number}.`,
    });
  }

  const mergerUsername = pr.merged_by?.login;
  if (mergerUsername && mergerUsername !== author.username) {
    const merger = await prisma.user.findUnique({ where: { username: mergerUsername } });
    if (merger) {
      await applyPoints({
        userId: merger.id,
        points: POINTS.CONFLICT_RESOLVED,
        ruleKey: 'pr.resolve_conflicts',
        entityId: pr.merge_commit_sha,
        notes: `+${POINTS.CONFLICT_RESOLVED} pts por resolver conflictos y hacer merge del PR #${pr.number}.`,
      });
    }
  }

  console.log('[PR Rule] Bono de calidad y penalizaciones por change_request requieren llamadas adicionales a la API.');
};

export const processPullRequestRule = async (event, user) => {
  const pr = event.payload.pull_request;
  const action = event.payload.action;

  switch (action) {
    case 'opened':
      await handlePrOpened(pr, user);
      break;
    case 'closed':
      if (pr.merged) {
        await handlePrMerged(pr, user);
      }
      break;
  }
};
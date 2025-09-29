// RUTA: src/modules/rules-points/engine/rules/review.rule.js

import { applyPoints } from '../../service/point.service.js';
import prisma from '../../../../config/prisma.js';

const POINTS = {
  CONSTRUCTIVE_REVIEW: 10,
  VALID_TAG_BONUS: 20,
};
const VALID_TAGS = ['#Diseño', '#Estilo', '#Pruebas', '#Seguridad', '#Performance'];

export const processReviewRule = async (event, reviewerUser) => {
  if (event.payload.action !== 'submitted') return;

  const review = event.payload.review;
  const pr = event.payload.pull_request;
  const reviewState = review.state;

  if (reviewState !== 'approved' && reviewState !== 'changes_requested') return;
  
  const existingReviewPoints = await prisma.pointLedger.findFirst({
    where: {
      userId: reviewerUser.id,
      ruleKey: { startsWith: 'review.' },
      entityId: pr.id.toString(),
    },
  });

  if (existingReviewPoints) return;

  let totalPoints = 0;
  const notes = [];

  totalPoints += POINTS.CONSTRUCTIVE_REVIEW;
  notes.push(`+${POINTS.CONSTRUCTIVE_REVIEW} pts por revisión en PR #${pr.number}`);

  if (reviewState === 'changes_requested' && review.body) {
    const foundTag = VALID_TAGS.find(tag => review.body.includes(tag));
    if (foundTag) {
      totalPoints += POINTS.VALID_TAG_BONUS;
      notes.push(`+${POINTS.VALID_TAG_BONUS} pts por usar la etiqueta '${foundTag}'`);
    }
  }

  if (totalPoints > 0) {
    await applyPoints({
      userId: reviewerUser.id,
      points: totalPoints,
      ruleKey: 'review.submission',
      entityId: pr.id.toString(),
      notes: notes.join(', '),
    });
  }
};
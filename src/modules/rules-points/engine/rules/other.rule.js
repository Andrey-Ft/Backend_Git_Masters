// RUTA: src/modules/rules-points/engine/rules/other.rule.js

import { applyPoints } from '../../service/point.service.js';

const POINTS = { SEMANTIC_RELEASE: 50 };
const SEMANTIC_VERSION_REGEX = /^v\d+\.\d+\.\d+$/;

const handleReleasePublished = async (event, user) => {
  const release = event.payload.release;
  if (SEMANTIC_VERSION_REGEX.test(release.tag_name) && release.body) {
    await applyPoints({
      userId: user.id,
      points: POINTS.SEMANTIC_RELEASE,
      ruleKey: 'release.semantic.creation',
      entityId: release.id.toString(),
      notes: `+${POINTS.SEMANTIC_RELEASE} pts por publicar el release semántico ${release.tag_name} con changelog.`,
    });
  }
};

export const processOtherEventsRule = async (event, user) => {
  if (event.eventType === 'release' && event.payload.action === 'published') {
    await handleReleasePublished(event, user);
  }
};
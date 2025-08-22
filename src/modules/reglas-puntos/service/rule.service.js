import { rules } from '../model/rule.model.js';
import { updatePoints, assignBadge } from '../../../shared/rewardUtils.js';

export const evaluateRules = async (activity, user) => {
  for (const rule of rules) {
    if (rule.condition(activity)) {
      const { points, badge } = rule.action(user);

      if (points) await updatePoints(user.id, points);
      if (badge) await assignBadge(user.id, badge);
    }
  }
}

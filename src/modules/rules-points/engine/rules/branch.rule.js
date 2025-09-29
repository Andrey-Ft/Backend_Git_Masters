// RUTA: src/modules/rules-points/engine/rules/branch.rule.js

import { applyPoints } from '../../service/point.service.js';

const VALID_BRANCH_NAME_REGEX = /^[A-Z]+-\d+_[a-z0-9]+_[a-z0-9-_]+$/;
const PROTECTED_BRANCHES = ['refs/heads/main', 'refs/heads/develop'];
const EXCEPTION_ROLES = ['ADMIN', 'INTEGRATOR'];
const POINTS = {
  VALID_BRANCH_NAME: 20,
  DIRECT_PUSH_PENALTY: -50,
  FORCE_PUSH_PENALTY: -100,
};

const handleBranchCreation = async (event, user) => {
  if (event.payload.ref_type !== 'branch') return;
  const branchName = event.payload.ref;
  if (VALID_BRANCH_NAME_REGEX.test(branchName)) {
    await applyPoints({
      userId: user.id,
      points: POINTS.VALID_BRANCH_NAME,
      ruleKey: 'branch.creation.valid_name',
      entityId: branchName,
      notes: `+${POINTS.VALID_BRANCH_NAME} pts por crear la rama con nombre válido: ${branchName}`,
    });
  }
};

const handleProtectedBranchPush = async (event, user) => {
  const branchRef = event.payload.ref;
  if (!PROTECTED_BRANCHES.includes(branchRef)) return;

  const branchName = branchRef.replace('refs/heads/', '');

  if (event.payload.forced) {
    await applyPoints({
      userId: user.id,
      points: POINTS.FORCE_PUSH_PENALTY,
      ruleKey: 'branch.push.force_push_penalty',
      entityId: event.payload.after,
      notes: `-${Math.abs(POINTS.FORCE_PUSH_PENALTY)} pts por hacer force-push a la rama protegida '${branchName}'`,
      isReversible: false,
    });
    return;
  }

  if (!EXCEPTION_ROLES.includes(user.role)) {
    await applyPoints({
      userId: user.id,
      points: POINTS.DIRECT_PUSH_PENALTY,
      ruleKey: 'branch.push.direct_push_penalty',
      entityId: event.payload.after,
      notes: `-${Math.abs(POINTS.DIRECT_PUSH_PENALTY)} pts por push directo a la rama protegida '${branchName}'`,
    });
  }
};

export const processBranchRule = async (event, user) => {
  switch (event.eventType) {
    case 'create':
      await handleBranchCreation(event, user);
      break;
    case 'push':
      await handleProtectedBranchPush(event, user);
      break;
    case 'delete':
      console.log('[BranchRule] La regla de borrado de rama post-merge requiere seguimiento de estado adicional.');
      break;
  }
};
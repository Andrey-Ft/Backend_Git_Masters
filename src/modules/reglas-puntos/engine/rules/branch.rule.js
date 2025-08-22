import { applyPoints } from '../../service/point.service.js';

const PROTECTED_BRANCHES = ['refs/heads/main', 'refs/heads/develop'];
const PENALTY_POINTS = -150;

/**
 * Evalúa si un 'push' fue hecho directamente a una rama protegida.
 * @param {object} event - El evento de 'push' desde la DB.
 * @param {object} user - El usuario que realizó la acción.
 */
export const processProtectedBranchRule = async (event, user) => {
    // Si el usuario es admin o integrador, no se aplica la penalización
    if (user.role === 'ADMIN' || user.role === 'INTEGRATOR') {
        return;
    }

    const ref = event.payload?.ref;
    if (PROTECTED_BRANCHES.includes(ref)) {
        await applyPoints({
            userId: user.id,
            points: PENALTY_POINTS,
            ruleKey: 'branch.push_to_protected_penalty',
            entityId: event.payload.after, // SHA del commit
            notes: `Push directo a la rama protegida ${ref}.`,
            isReversible: false, // Requiere revisión manual para revertir
        });

        console.warn(`[BranchRule] ¡ALERTA! Usuario ${user.username} hizo push directo a ${ref}.`);
    }
};
import { evaluateRules } from '../service/rule.service.js';

export const handleActivity = async (req, res) => {
  const { activity, user } = req.body;

  try {
    await evaluateRules(activity, user);
    res.status(200).json({ message: 'Actividad procesada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al evaluar reglas' });
  }
};

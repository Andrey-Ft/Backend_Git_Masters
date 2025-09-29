import express from 'express';
import { handleActivity } from '../controller/rule.controller.js';

const router = express.Router();

router.post('/evaluar', handleActivity);

export default router;

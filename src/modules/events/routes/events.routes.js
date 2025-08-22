import express from 'express';
import requireAuth from '../../../shared/middlewares/auth.middleware.js';
import { listEvents, getEventById } from '../controller/events.controller.js';

const router = express.Router();

// Bypass temporal para Postman
function testBypassAuth(req, res, next) {
  const key = req.header('X-API-Key');
  if (process.env.TEST_API_KEY && key === process.env.TEST_API_KEY) {
    return next();
  }
  return requireAuth(req, res, next);
}

router.get('/', testBypassAuth, listEvents);
router.get('/:id', testBypassAuth, getEventById);

export default router;
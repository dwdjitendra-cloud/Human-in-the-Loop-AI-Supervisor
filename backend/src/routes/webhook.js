import express from 'express';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Simple local webhook receiver
// POST /api/webhook/notify
router.post('/notify', express.json({ limit: '1mb' }), async (req, res) => {
  const event = req.body || {};
  logger.info(`[WEBHOOK] Received event: ${event.type || 'unknown'}`);
  logger.info(`[WEBHOOK] Message: ${event.message || ''}`);
  logger.info(`[WEBHOOK] Payload: ${JSON.stringify(event.payload || {})}`);

  res.json({ success: true, received: true, event });
});

export default router;

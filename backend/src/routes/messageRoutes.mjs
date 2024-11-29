import express from 'express';
import messageController from '../controllers/messageController.mjs';
import { messageAPIs } from '../controllers/messageAPIs.mjs';
import { rateLimiterMiddleware } from '../rateLimit/rateLimitConfig.mjs';
import { logger } from '../logger.mjs';

const USE_REDIS = process.env.USE_REDIS === 'true';
const router = express.Router();

// Validation middleware  
const validateAbortRequest = (req, res, next) => {
  const { api } = req.body;
  if (!api || typeof api !== 'string') {
    return res.status(400).json({
      error: 'Invalid request: api parameter is required and must be a string'
    });
  }
  next();
};

if (USE_REDIS) {
  router.use(rateLimiterMiddleware);
}

router.post('/', messageController);

router.post('/abort', validateAbortRequest, async (req, res) => {
  const { api } = req.body;
  const messageAPI = messageAPIs[api];

  if (!messageAPI) {
    logger.error(`Unsupported API: ${api}`);
    return res.status(400).json({ error: `Unsupported API: ${api}` });
  }

  if (typeof messageAPI.abortRequest !== 'function') {
    logger.error(`API ${api} does not support aborting requests.`);
    return res.status(400).json({
      error: `API ${api} does not support aborting requests.`
    });
  }

  try {
    await messageAPI.abortRequest();
    logger.info(`Request to API ${api} has been aborted.`);
    return res.status(202).json({
      message: `Request to API ${api} has been aborted.`
    });
  } catch (error) {
    logger.error(`Error aborting ${api} request:`, error);
    return res.status(500).json({
      error: `Failed to abort ${api} request`
    });
  }
});

// Global error handler  
router.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected error occurred' });
});

export default router;  
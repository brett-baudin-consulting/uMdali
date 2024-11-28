import express from 'express';

import messageController from '../controllers/messageController.mjs';
import { messageAPIs } from '../controllers/messageAPIs.mjs';
import { rateLimiterMiddleware } from '../rateLimit/rateLimitConfig.mjs';
import {logger} from '../logger.mjs';

const USE_REDIS = process.env.USE_REDIS === 'true';

const router = express.Router();

if (USE_REDIS) {
  router.use(rateLimiterMiddleware);
}

router.post('/', messageController);

router.post('/abort', async (req, res, next) => {
  const { api } = req.body; // Destructuring for clarity
  const messageAPI = messageAPIs[api];

  if (!messageAPI) {
    logger.error(`Unsupported API: ${api}`);
    return res.status(400).send({ error: `Unsupported API: ${api}` });
  }

  if (typeof messageAPI.abortRequest !== 'function') {
    logger.error(`API ${api} does not support aborting requests.`);
    return res.status(400).send({ error: `API ${api} does not support aborting requests.` });
  }

  try {
    await messageAPI.abortRequest(); // Assuming abortRequest is asynchronous and returns a Promise
    logger.info(`Request to API ${api} has been aborted.`);
    res.status(202).send({ message: `Request to API ${api} has been aborted.` }); // Using 202 Accepted for asynchronous actions
  } catch (error) {
    next(error); // Forward error to error handling middleware
  }
});

// Generic error handling middleware
router.use((err, req, res, next) => {
  logger.error(err); // Log the error with winston
  res.status(500).send({ error: 'An unexpected error occurred' });
});

const messageRoutes = router;

export default messageRoutes;
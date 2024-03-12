// textToSpeechModelRoutes.mjs
import express from 'express';
import { logger } from '../logger.mjs';
import TextToSpeechModel from '../models/TextToSpeechModel.mjs';
import { handleRequest, ttsAPIs } from '../controllers/textToSpeechModelController.mjs';

const router = express.Router();

router.post('/', handleRequest);

router.post('/abort', async (req, res, next) => {
  const { api } = req.body;
  const messageAPI = ttsAPIs[api];

  if (!messageAPI) {
    logger.error(`Unsupported API: ${api}`);
    return res.status(400).json({ error: `Unsupported API: ${api}` });
  }

  if (typeof messageAPI.abortRequest !== 'function') {
    logger.error(`API ${api} does not support aborting requests.`);
    return res.status(400).json({ error: `API ${api} does not support aborting requests.` });
  }

  try {
    await messageAPI.abortRequest();
    logger.info(`Request to API ${api} has been aborted.`);
    res.status(202).json({ message: `Request to API ${api} has been aborted.` });
  } catch (error) {
    next(error);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const models = await TextToSpeechModel.find({ available: true }).sort({ name: 1 });
    res.json(models);
  } catch (error) {
    next(error);
  }
});

router.use((err, req, res, next) => {
  logger.error(err);
  res.status(500).json({ error: 'An unexpected error occurred' });
});

export default router;
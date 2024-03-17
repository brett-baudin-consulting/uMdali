import express from 'express';
import { StatusCodes } from 'http-status-codes';

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
    return res.status(StatusCodes.BAD_REQUEST).json({ error: `Unsupported API: ${api}` });
  }

  if (typeof messageAPI.abortRequest !== 'function') {
    logger.error(`API ${api} does not support aborting requests.`);
    return res.status(StatusCodes.BAD_REQUEST).json({ error: `API ${api} does not support aborting requests.` });
  }

  try {
    await messageAPI.abortRequest();
    logger.info(`Request to API ${api} has been aborted.`);
    res.status(StatusCodes.ACCEPTED).json({ message: `Request to API ${api} has been aborted.` });
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

  const statusCode = err.isOperational ? StatusCodes.BAD_REQUEST : StatusCodes.INTERNAL_SERVER_ERROR;
  const errorMessage = err.isOperational ? err.message : 'An unexpected error occurred';

  res.status(statusCode).json({ error: errorMessage });
});

export default router;
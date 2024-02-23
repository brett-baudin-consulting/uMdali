import express from 'express';
import { logger } from '../logger.mjs';
import SpeechToTextModel from '../models/SpeechToTextModel.mjs';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const models = await SpeechToTextModel.find({ available: true }).sort({ name: 1 });
    res.send(models);
  } catch (error) {
    logger.error(error);
    res.status(400).send({ error: error.message });
  }
});

const speechToTextModelRoutes = router;
export default speechToTextModelRoutes;
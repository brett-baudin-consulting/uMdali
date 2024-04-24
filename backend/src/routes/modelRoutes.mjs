import express from 'express';
import { logger } from '../logger.mjs';
import Model from '../models/Model.mjs';

const router = express.Router();
async function removeOldModels() {
  try {
    await Model.deleteMany({ isSupportsContext: null });
  } catch (error) {
    logger.error(error);
  }};

router.get('/', async (req, res) => {
  try {
    await removeOldModels();
    const models = await Model.find({ available: true }).sort({ name: 1 }); 
    res.send(models);
  } catch (error) {
    logger.error(error);
    res.status(400).send({ error: error.message });
  }
});

const modelRoutes = router;
export default modelRoutes;
import express from 'express';

import { logger } from '../logger.mjs';
import handleRequest from '../controllers/dataImportController.mjs';

const router = express.Router();

router.post('/', handleRequest);


export default router;
import express from 'express';

import handleRequest from '../controllers/dataImportController.mjs';

const router = express.Router();

router.post('/', handleRequest);


export default router;
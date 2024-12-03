import express from 'express';

import { getUser } from '../controllers/loginController.mjs';
import { skipAuth } from '../middlewares/auth.mjs';

const router = express.Router();

router.post('/', skipAuth, getUser);

export default router;  
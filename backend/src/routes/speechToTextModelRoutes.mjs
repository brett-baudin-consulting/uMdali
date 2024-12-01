import express from 'express';  
import SpeechToTextController from '../controllers/speechToTextModelController.mjs';

const router = express.Router();

router.get('/', SpeechToTextController.getSpeechToTextModels);

export default router;  
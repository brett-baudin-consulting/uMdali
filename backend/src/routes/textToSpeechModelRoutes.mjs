import express from 'express';  
import TextToSpeechController from '../controllers/textToSpeechModelController.mjs';

const router = express.Router();

router.get('/', TextToSpeechController.getTextToSpeechModels);
router.post('/', TextToSpeechController.generateSpeech);

export default router;  
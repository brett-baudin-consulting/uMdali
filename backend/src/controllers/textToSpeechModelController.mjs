// textToSpeechModelController.mjs
import TextToSpeechModel from '../models/TextToSpeechModel.mjs';
import { logger } from '../logger.mjs';
import ElevenLabsAPI from '../ttsAPIs/ElevenLabsTTSAPI.mjs';
import OpenAITTSAPI from '../ttsAPIs/OpenAITTSAPI.mjs';

export const ttsAPIs = {
  "Eleven Labs": new ElevenLabsAPI(),
  "OpenAI": new OpenAITTSAPI(), 
};

function getAPI(vendorName) {
  return ttsAPIs[vendorName];
}

async function handleRequest(req, res) {
  console.log('handleRequest textToSpeechModelController.mjs');
  const {textToSpeechModel, text, voice_id ,  vendor } = req.body;
  console.log('body:', req.body);
  const ttsAPI = getAPI(vendor);
  if (!ttsAPI) {
    res.status(400).json({ error: `Unsupported API: ${textToSpeechModel?.vendor}` });
    return;
  }

  const abortController = new AbortController();
  const { signal } = abortController;
  res.on("close", () => {
    abortController.abort();
  });

  try {
    const content = await ttsAPI.sendRequest(textToSpeechModel, text, signal, voice_id);
    console.log('content: start');
    res.write(content);
    res.end();
    console.log('content: end');
  } catch (error) {
    logger.error("Error handling request:", error);
    res.status(500).json({ error: error.message });
  }
}

async function upsertModel(modelData) {
  try {
    const updatedModel = await TextToSpeechModel.findOneAndUpdate(
      { name: modelData.name },
      modelData,
      { new: true, upsert: true }
    );
    return updatedModel;
  } catch (error) {
    logger.error('Error upserting model:', error);
    throw error;
  }
}

export { upsertModel, handleRequest };
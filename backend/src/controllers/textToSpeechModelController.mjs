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
  const api = ttsAPIs[vendorName];
  if (!api) {
    throw new Error(`Unsupported API: ${vendorName}`);
  }
  return api;
}

async function handleRequest(req, res) {
  try {
    // Correctly destructuring required parameters from req.body
    const { text, voice_id, vendor, textToSpeechModel } = req.body;
    const ttsAPI = getAPI(vendor); // Correctly retrieves the API instance or throws an error if unsupported

    const abortController = new AbortController();
    const { signal } = abortController;
    res.on("close", () => {
      abortController.abort(); // Aborts the request if the client closes the connection
    });

    // Correctly passing parameters to sendRequest
    const content = await ttsAPI.sendRequest(textToSpeechModel, text, voice_id, signal);
    res.send(content); // Assuming content is not a stream. If it is, handle accordingly.

  } catch (error) {
    logger.error("Error handling request:", error);
    const errorMessage = typeof error.message === 'string' ? error.message : 'Unknown error occurred';
    res.status(500).json({ error: errorMessage });
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
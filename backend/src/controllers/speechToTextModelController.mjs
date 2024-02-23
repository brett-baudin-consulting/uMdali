import SpeechToTextModel from '../models/SpeechToTextModel.mjs';
import { logger } from '../logger.mjs';

async function upsertModel(modelData) {
  try {
    const updatedModel = await SpeechToTextModel.findOneAndUpdate(
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

export { upsertModel };

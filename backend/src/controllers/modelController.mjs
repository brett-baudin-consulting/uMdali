import Model from '../models/Model.mjs';
import { logger } from '../logger.mjs';

async function upsertModel(modelData) {
  try {
    const updatedModel = await Model.findOneAndUpdate(
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

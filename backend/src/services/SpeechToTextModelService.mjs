import SpeechToTextModel from '../models/SpeechToTextModel.mjs';
import { logger } from '../logger.mjs';

class SpeechToTextModelService {
    async upsertModel(modelData) {
        if (!modelData?.name) {
            throw new Error('Model name is required');
        }

        try {
            const updatedModel = await SpeechToTextModel.findOneAndUpdate(
                { name: modelData.name },
                { ...modelData },
                {
                    new: true,
                    upsert: true,
                    runValidators: true
                }
            );
            return updatedModel;
        } catch (error) {
            logger.error(`Error upserting model ${modelData.name}:`, error);
            throw error;
        }
    }

    async getAvailableModels() {
        try {
            const models = await SpeechToTextModel.find({
                available: true
            })
                .sort({ name: 1 })
                .lean()
                .exec() || [];
            console.log(JSON.stringify(models));
            return Array.isArray(models) ? models : [];
        } catch (error) {
            logger.error('Error fetching available models:', error);
            return [];
        }
    }
}

export default new SpeechToTextModelService();  
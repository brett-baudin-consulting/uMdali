import TextToSpeechModel from '../models/TextToSpeechModel.mjs';
import { logger } from '../logger.mjs';
import ElevenLabsAPI from '../ttsAPIs/ElevenLabsTTSAPI.mjs';
import OpenAITTSAPI from '../ttsAPIs/OpenAITTSAPI.mjs';

export class TextToSpeechModelService {
    constructor() {
        this.ttsAPIs = {
            "Eleven Labs": new ElevenLabsAPI(),
            "OpenAI": new OpenAITTSAPI(),
        };
    }

    getAPI(vendorName) {
        const api = this.ttsAPIs[vendorName];
        if (!api) {
            throw new Error(`Unsupported API: ${vendorName}`);
        }
        return api;
    }

    async generateSpeech(textToSpeechModel, text, voice_id, vendor, signal) {
        const ttsAPI = this.getAPI(vendor);
        return await ttsAPI.sendRequest(textToSpeechModel, text, voice_id, signal);
    }

    async upsertModel(modelData) {
        try {
            return await TextToSpeechModel.findOneAndUpdate(
                { name: modelData.name },
                modelData,
                { new: true, upsert: true }
            );
        } catch (error) {
            logger.error('Error upserting model:', error);
            throw error;
        }
    }
    async getAvailableModels() {
        try {
            const models = await TextToSpeechModel.find({
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

export default new TextToSpeechModelService();
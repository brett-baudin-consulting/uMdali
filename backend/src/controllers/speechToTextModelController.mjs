import SpeechToTextModelService from '../services/SpeechToTextModelService.mjs';
import { logger } from '../logger.mjs';

class SpeechToTextController {
  async upsertModel(req, res) {
    try {
      const modelData = req.body;

      // Add input validation  
      if (!modelData || typeof modelData !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid model data provided'
        });
      }

      const updatedModel = await SpeechToTextModelService.upsertModel(modelData);

      if (!updatedModel) {
        return res.status(404).json({
          success: false,
          error: 'Model not found or could not be updated'
        });
      }

      return res.status(200).json({
        success: true,
        data: updatedModel
      });
    } catch (error) {
      logger.error('Controller error while upserting model:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to upsert model',
        message: error.message // Add error message for debugging  
      });
    }
  }

  async getSpeechToTextModels(req, res) {
    try {
      const models = await SpeechToTextModelService.getAvailableModels();

      return res.status(200).json({
        success: true,
        data: models || [] // Ensure we always return an array  
      });
    } catch (error) {
      logger.error('Controller error while getting models:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get models',
        message: error.message // Add error message for debugging  
      });
    }
  }
}

export default new SpeechToTextController();  
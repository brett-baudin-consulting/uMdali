import TextToSpeechModelService from '../services/TextToSpeechModelService.mjs';
import { logger } from '../logger.mjs';

class SpeechToTextController {
  constructor() {
    // Bind methods to ensure correct 'this' context  
    this.upsertModel = this.upsertModel.bind(this);
    this.getTextToSpeechModels = this.getTextToSpeechModels.bind(this);
    this.generateSpeech = this.generateSpeech.bind(this);
  }

  handleError(res, error, message) {
    logger.error(message, error);
    return res.status(500).json({
      success: false,
      error: message,
      message: error.message
    });
  }

  async upsertModel(req, res) {
    try {
      const modelData = req.body;

      const requiredFields = ['name', 'vendor'];
      const missingFields = requiredFields.filter(field => !modelData[field]);

      if (missingFields.length) {
        return res.status(400).json({
          success: false,
          error: `Missing required fields: ${missingFields.join(', ')}`
        });
      }

      if (!modelData || typeof modelData !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Invalid model data provided'
        });
      }

      const updatedModel = await TextToSpeechModelService.upsertModel(modelData);

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
      return this.handleError(res, error, 'Failed to upsert model');
    }
  }

  async getTextToSpeechModels(req, res) {
    try {
      const models = await TextToSpeechModelService.getAvailableModels();
      logger.debug('Retrieved TextToSpeechModels', { models });

      return res.status(200).json({
        success: true,
        data: models || []
      });
    } catch (error) {
      return this.handleError(res, error, 'Failed to get models');
    }
  }

  async generateSpeech(req, res) {
    try {
      const { text, voice_id, vendor, textToSpeechModel } = req.body;

      // Validate required inputs  
      if (!text || !voice_id || !vendor || !textToSpeechModel) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters'
        });
      }

      // Validate text length  
      if (typeof text !== 'string' || text.length > 1000) { // adjust max length as needed  
        return res.status(400).json({
          success: false,
          error: 'Invalid text parameter or text too long'
        });
      }

      const abortController = new AbortController();
      const { signal } = abortController;

      // Clean up on client disconnect  
      res.on('close', () => {
        abortController.abort();
        logger.debug('Client disconnected, speech generation aborted');
      });

      const content = await TextToSpeechModelService.generateSpeech(
        textToSpeechModel,
        text,
        voice_id,
        vendor,
        signal
      );

      if (!content) {
        return res.status(404).json({
          success: false,
          error: 'Failed to generate speech content'
        });
      }

      // Set appropriate headers for audio stream  
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'no-cache');
      return res.send(content);

    } catch (error) {
      // Check if error was due to abort  
      if (error.name === 'AbortError') {
        return res.status(499).json({ // Using 499 Client Closed Request  
          success: false,
          error: 'Request cancelled by client'
        });
      }
      return this.handleError(res, error, 'Failed to generate speech');
    }
  }
}

export default new SpeechToTextController();  
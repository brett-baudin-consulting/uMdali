import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import TextToSpeechModelService from '../services/TextToSpeechModelService.mjs';
import { logger } from '../logger.mjs';

export default async function loadSpeechToTextModels() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const modelsConfigPath = path.join(dirname, 'textToSpeechModelsConfig.json');

  try {
    const modelsConfigJson = await fs.readFile(modelsConfigPath, 'utf8');
    let modelsConfig;

    // Attempt to parse the JSON, log and return on failure.
    try {
      modelsConfig = JSON.parse(modelsConfigJson);
    } catch (parseError) {
      logger.error('Error parsing textToSpeechModelsConfig.json:', parseError);
      return;
    }

    // Process each model in the configuration.
    for (const modelData of modelsConfig) {
      try {
        await TextToSpeechModelService.upsertModel(modelData);
      } catch (error) {
        logger.error(`Error loading model ${modelData.id}:`, error);
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.error(`No textToSpeechModelsConfig.json file found at ${modelsConfigPath}`);
    } else {
      logger.error('Failed to load models:', error);
    }
  }
}
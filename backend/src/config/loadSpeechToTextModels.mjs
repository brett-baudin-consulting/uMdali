import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import SpeechToTextModelService  from '../services/SpeechToTextModelService.mjs';
import { logger } from '../logger.mjs';

export default async function loadSpeechToTextModels() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const modelsConfigPath = path.join(dirname, 'speechtoTextModelsConfig.json');

  try {
    const modelsConfigJson = await fs.readFile(modelsConfigPath, 'utf8');
    let modelsConfig;
    try {
      modelsConfig = JSON.parse(modelsConfigJson);
    } catch (parseError) {
      logger.error('Error parsing speechtoTextModelsConfig.json:', parseError);
      return;
    }

    for (const modelData of modelsConfig) {
      try {
        await SpeechToTextModelService.upsertModel(modelData);
      } catch (error) {
        logger.error(`Error loading model ${modelData.id}:`, error);
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.error(`No speechtoTextModelsConfig.json file found at ${modelsConfigPath}`);
    } else {
      logger.error('Failed to load models:', error);
    }
  }
}
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { upsertModel } from '../controllers/modelController.mjs';
import { logger } from '../logger.mjs';

export default async function loadModels() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const modelsConfigPath = path.join(dirname, 'modelsConfig.json');

  try {
    const modelsConfigJson = await fs.readFile(modelsConfigPath, 'utf8');
    let modelsConfig;
    try {
      modelsConfig = JSON.parse(modelsConfigJson);
    } catch (parseError) {
      logger.error('Error parsing modelsConfig.json:', parseError);
      return;
    }

    for (const modelData of modelsConfig) {
      try {
        await upsertModel(modelData);
      } catch (error) {
        logger.error(`Error loading model ${modelData.id}:`, error);
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.error(`No modelsConfig.json file found at ${modelsConfigPath}`);
    } else {
      logger.error('Failed to load models:', error);
    }
  }
}
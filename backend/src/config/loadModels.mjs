import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ModelService } from '../services/ModelService.mjs';
import { logger } from '../logger.mjs';

const modelService = new ModelService();

export default async function loadModels() {
  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const modelsConfigPath = path.join(dirname, 'modelsConfig.json');

  try {
    const modelsConfigJson = await fs.readFile(modelsConfigPath, 'utf8');
    let modelsConfig;

    try {
      modelsConfig = JSON.parse(modelsConfigJson);
      if (!Array.isArray(modelsConfig)) {
        throw new Error('Models config must be an array');
      }
    } catch (parseError) {
      logger.error('Error parsing modelsConfig.json:', parseError);
      return;
    }

    const results = await Promise.allSettled(
      modelsConfig.map(async (modelData) => {
        try {
          await modelService.upsertModel(modelData);
        } catch (error) {
          logger.error(`Error loading model ${modelData?.id || 'unknown'}:`, error);
        }
      })
    );

    const failedCount = results.filter(r => r.status === 'rejected').length;
    if (failedCount > 0) {
      logger.warn(`Failed to load ${failedCount} models`);
    }

  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.error(`No modelsConfig.json file found at ${modelsConfigPath}`);
    } else {
      logger.error('Failed to load models:', error);
    }
  }
}  
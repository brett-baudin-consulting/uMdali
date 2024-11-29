import { ModelService } from '../services/ModelService.mjs';
import { logger } from '../logger.mjs';

export class ModelController {
  constructor() {
    this.modelService = new ModelService();
  }
  upsertModel = async (req, res) => {
    try {
      const model = await this.modelService.upsertModel(req.body);
      res.status(201).json(model);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ error: error.message });
    }
  }

  getAllModels = async (req, res) => {
    try {
      const models = await this.modelService.getAllModels();
      res.json(models);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ error: error.message });
    }
  };

  getModelById = async (req, res) => {
    try {
      const model = await this.modelService.getModelById(req.params.id);
      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }
      res.json(model);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ error: error.message });
    }
  };

  createModel = async (req, res) => {
    try {
      const model = await this.modelService.createModel(req.body);
      res.status(201).json(model);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ error: error.message });
    }
  };

  updateModel = async (req, res) => {
    try {
      const model = await this.modelService.updateModel(req.params.id, req.body);
      if (!model) {
        return res.status(404).json({ error: 'Model not found' });
      }
      res.json(model);
    } catch (error) {
      logger.error(error);
      res.status(400).json({ error: error.message });
    }
  };

  deleteModel = async (req, res) => {
    try {
      const result = await this.modelService.deleteModel(req.params.id);
      if (!result) {
        return res.status(404).json({ error: 'Model not found' });
      }
      res.status(204).send();
    } catch (error) {
      logger.error(error);
      res.status(400).json({ error: error.message });
    }
  };
}  
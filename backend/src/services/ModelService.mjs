import Model from '../models/Model.mjs';
import { logger } from '../logger.mjs';

export class ModelService {
    async upsertModel(modelData) {
        try {
            const updatedModel = await Model.findOneAndUpdate(
                { name: modelData.name },
                modelData,
                { new: true, upsert: true }
            );
            return updatedModel;
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async removeOldModels() {
        try {
            await Model.deleteMany({ isSupportsContext: null });
        } catch (error) {
            logger.error(error);
            throw error;
        }
    }

    async getAllModels() {
        await this.removeOldModels();
        return Model.find({ available: true }).sort({ name: 1 });
    }

    async getModelById(id) {
        return Model.findById(id);
    }

    async createModel(modelData) {
        const model = new Model(modelData);
        return model.save();
    }

    async updateModel(id, modelData) {
        return Model.findByIdAndUpdate(
            id,
            modelData,
            { new: true, runValidators: true }
        );
    }

    async deleteModel(id) {
        return Model.findByIdAndDelete(id);
    }
}  

export default new ModelService();
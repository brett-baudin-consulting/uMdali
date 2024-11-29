import DataImportModel from '../models/DataImportModel.mjs';
export class DataImportModelService {
    async getAllDataImports() {
        try {
            return await DataImportModel.find({ available: true }).sort({ name: 1 });
        } catch (error) {
            const err = new Error('Failed to fetch data imports');
            err.status = 400;
            err.errors = error;
            throw err;
        }
    }
}
export default new DataImportModelService();


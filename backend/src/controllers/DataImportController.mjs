// controllers/DataImportController.mjs  
import { logger } from "../logger.mjs";  
import { DataImportService } from "../services/DataImportService.mjs";

export class DataImportController {  
  constructor() {  
    this.dataImportService = new DataImportService();  
  }

  async handleImport(req, res) {  
    const { user, dataImport } = req.body;

    if (!user?.settings?.dataImport || !dataImport) {  
      return res.status(400).json({ error: 'Invalid request body' });  
    }

    try {  
      const result = await this.dataImportService.processImport(user, dataImport);  
      logger.info("Import result:", result);  
      res.json(result);  
    } catch (error) {  
      logger.error("Error handling request:", error);  
      res.status(500).json({ error: error.message });  
    }  
  }  
}

// Export a factory function for the controller  
export default function createDataImportController() {  
  return new DataImportController();  
}  
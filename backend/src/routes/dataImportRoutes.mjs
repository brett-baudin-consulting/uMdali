// routes/dataImportRoutes.mjs  
import express from 'express';  
import { DataImportController } from '../controllers/DataImportController.mjs';

const router = express.Router();  
const dataImportController = new DataImportController();

// Bind the controller method to maintain correct 'this' context  
router.post('/', (req, res) => dataImportController.handleImport(req, res));

export default router;  
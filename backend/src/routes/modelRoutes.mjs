import express from 'express';  
import { ModelController } from '../controllers/modelController.mjs';

const router = express.Router();  
const controller = new ModelController();

router.get('/', controller.getAllModels);  
router.get('/:id', controller.getModelById);  
router.post('/', controller.createModel);  
router.put('/:id', controller.updateModel);  
router.delete('/:id', controller.deleteModel);

export default router;  
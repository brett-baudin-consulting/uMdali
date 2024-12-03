// routes/fileRouter.mjs  
import express from 'express';
import { FileService } from '../services/FileService.mjs';
import { FileController } from '../controllers/fileController.mjs';

const router = express.Router();
const fileService = new FileService();
const fileController = new FileController(fileService);

// Bind controller methods to maintain 'this' context  
const checkUserId = fileController.checkUserId.bind(fileController);
const setupUserDirectory = fileController.setupUserDirectory.bind(fileController);
const handleError = fileController.handleError.bind(fileController);

// Upload route  
router.post('/:userId',
  checkUserId,
  setupUserDirectory,
  fileController.upload.single('file'),
  (req, res, next) => fileController.uploadFile(req, res, next)
);

// Download route  
router.get('/:userId/:filename',
  checkUserId,
  setupUserDirectory,
  (req, res) => fileController.getFile(req, res)
);

// Delete route  
router.delete('/:userId/:filename',
  checkUserId,
  setupUserDirectory,
  (req, res, next) => fileController.deleteFile(req, res, next)
);

// Error handling middleware  
router.use(handleError);

export default router;  
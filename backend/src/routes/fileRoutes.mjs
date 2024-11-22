import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import sharp from 'sharp';
import { promises as fsPromises } from 'fs';

import { logger } from '../logger.mjs';

const router = express.Router();

// Constants  
const FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB  
const ICON_SIZE = { width: 64, height: 64 };
const STANDARD_ICON_PATH = path.join('public', 'images', 'standard_icon.png');
const MAX_FILENAME_LENGTH = 255;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  // Add other allowed types as needed  
]);

// Custom Errors  
class IconCreationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IconCreationError';
  }
}

// Helper Functions  
const sanitizeFilename = (filename) => {
  const basename = path.basename(filename);
  return basename.replace(/[^a-zA-Z0-9-_\.]/g, '');
};

const getUserDir = (userId) => path.join('uploads', userId);

const createIcon = async (filePath, mimeType) => {
  if (!mimeType.startsWith('image/')) {
    return STANDARD_ICON_PATH;
  }

  const iconPath = filePath.replace(path.extname(filePath), '_icon.png');
  try {
    await sharp(filePath)
      .resize(ICON_SIZE)
      .toFile(iconPath);
    return iconPath;
  } catch (error) {
    logger.error(`Error creating icon: ${error.message}`);
    throw new IconCreationError(error.message);
  }
};

// Middleware  
const checkUserId = (req, res, next) => {
  const { userId } = req.params;
  if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
    logger.error('Invalid or missing userId.');
    return res.status(400).json({ error: 'Invalid or missing userId.' });
  }
  next();
};

const userDirectory = async (req, res, next) => {
  const userDir = getUserDir(req.params.userId);
  try {
    await fsPromises.mkdir(userDir, { recursive: true });
    req.userDir = userDir;
    next();
  } catch (err) {
    logger.error(`Error creating user directory: ${err.message}`);
    next(err);
  }
};

// Multer Configuration  
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, req.userDir);
  },
  filename: (req, file, cb) => {
    const sanitizedName = sanitizeFilename(file.originalname);
    const fileExtension = path.extname(sanitizedName).toLowerCase();
    cb(null, `${uuidv4()}${fileExtension}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error('File type not allowed'), false);
  }

  if (file.originalname.length > MAX_FILENAME_LENGTH) {
    return cb(new Error('Filename too long'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: FILE_SIZE_LIMIT,
    files: 1
  },
  fileFilter
});

// Route Handlers  
router.post('/:userId', checkUserId, userDirectory, upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    logger.error('No file uploaded.');
    return res.status(400).json({ error: 'No file uploaded.' });
  }

  let iconPath;
  try {
    iconPath = await createIcon(req.file.path, req.file.mimetype);

    res.status(201).json({
      message: 'File and icon uploaded successfully.',
      file: {
        path: req.file.path,
        name: req.file.filename,
        originalName: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
      },
      icon: { path: iconPath },
    });
  } catch (error) {
    const cleanup = async () => {
      try {
        await fsPromises.unlink(req.file.path);
        if (iconPath) {
          await fsPromises.unlink(iconPath);
        }
      } catch (cleanupError) {
        logger.error(`Cleanup error: ${cleanupError.message}`);
      }
    };

    await cleanup();
    next(error);
  }
});

const sendFileSecurely = async (req, res, filePath) => {
  const resolvedPath = path.join(req.userDir, filePath);
  const relativePath = path.relative(req.userDir, resolvedPath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    logger.error('Attempt to access invalid file path.');
    return res.status(400).json({ error: 'Invalid file path.' });
  }

  try {
    await fsPromises.access(resolvedPath);
    const rootDir = process.cwd();

    // Disable caching  
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.sendFile(resolvedPath, { root: rootDir });
  } catch (err) {
    logger.error(`Error sending file: ${err.message}`);
    res.status(404).json({ error: 'File not found.' });
  }
};

router.get('/:userId/:filename', checkUserId, userDirectory, async (req, res) => {
  await sendFileSecurely(req, res, req.params.filename);
});

router.delete('/:userId/:filename', checkUserId, userDirectory, async (req, res, next) => {
  const filePath = path.join(req.userDir, req.params.filename);
  const iconPath = filePath.replace(path.extname(filePath), '_icon.png');

  const unlinkIfExists = async (filePath) => {
    try {
      await fsPromises.access(filePath);
      await fsPromises.unlink(filePath);
    } catch (err) {
      logger.error(`Error deleting file: ${err.message}`);
    }
  };

  try {
    await Promise.all([unlinkIfExists(filePath), unlinkIfExists(iconPath)]);
    res.json({ message: 'File and icon deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// Error Handlers  
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(413).json({
          error: `File too large. Maximum size is ${FILE_SIZE_LIMIT / (1024 * 1024)}MB`
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Unexpected field name in upload'
        });
      default:
        return res.status(400).json({
          error: 'Error uploading file'
        });
    }
  }

  if (error) {
    logger.error(error);
    const statusCode = error instanceof IconCreationError ? 422 : 500;
    res.status(statusCode).json({
      error: 'An error occurred during file processing.',
      details: error.message
    });
    return;
  }
  next();
});

export default router;  
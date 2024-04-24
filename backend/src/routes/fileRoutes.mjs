import express from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import sharp from 'sharp';
import { promises as fsPromises } from 'fs';

import { logger } from '../logger.mjs';

const router = express.Router();
const FILE_SIZE_LIMIT = 10000000; // 10MB
const ICON_SIZE = { width: 64, height: 64 };
const STANDARD_ICON_PATH = path.join('public', 'images', 'standard_icon.png');
class IconCreationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'IconCreationError';
  }
}

const createIcon = async (filePath, mimeType) => {
  if (mimeType.startsWith('image/')) {
    const iconPath = filePath.replace(path.extname(filePath), '_icon.png');
    try {
      await sharp(filePath)
        .resize(ICON_SIZE.width, ICON_SIZE.height)
        .toFile(iconPath);
      return iconPath;
    } catch (error) {
      logger.error(`Error creating icon: ${error.message}`);
      throw new IconCreationError(error.message);
    }
  } else {
    // Return a standard icon path for non-image files
    return STANDARD_ICON_PATH;
  }
};

const checkUserId = (req, res, next) => {
  const { userId } = req.params;
  if (!userId) {
    logger.error('No userId provided.');
    return res.status(400).send({ error: 'No userId provided.' });
  }
  next();
};

const userDirectory = async (req, res, next) => {
  const { userId } = req.params;
  const userDir = path.join('uploads', userId);

  try {
    await fsPromises.mkdir(userDir, { recursive: true });
    req.userDir = userDir;
    next();
  } catch (err) {
    next(err);
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, req.userDir);
  },
  filename: (req, file, cb) => {
    const fileExt = path.extname(file.originalname);
    cb(null, `${uuidv4()}${fileExt}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: FILE_SIZE_LIMIT },
});

router.post('/:userId', checkUserId, userDirectory, upload.single('file'), async (req, res, next) => {
  if (!req.file) {
    logger.error('No file uploaded.');
    return res.status(422).send({ error: 'No file uploaded.' });
  }

  try {
    const iconPath = await createIcon(req.file.path, req.file.mimetype);
    res.status(201).send({
      message: 'File and icon uploaded successfully.',
      file: {
        path: req.file.path,
        name: req.file.filename,
        originalName: req.file.originalname,
        type: req.file.mimetype,
        size: req.file.size,
      },
      icon: {
        path: iconPath
      }
    });
  } catch (error) {
    next(error);
  }
});

const sendFileSecurely = async (req, res, filePath) => {
  const resolvedPath = path.resolve(req.userDir, filePath);
  if (!resolvedPath.startsWith(path.resolve(req.userDir)) || path.relative(req.userDir, resolvedPath).startsWith('..')) {
    return res.status(400).send({ error: 'Invalid file path.' });
  }

  try {
    await fsPromises.stat(resolvedPath);
    res.sendFile(resolvedPath);
  } catch {
    res.status(404).send({ error: 'Image does not exist.' });
  }
};

router.get('/:userId/image/:filename', checkUserId, userDirectory, async (req, res) => {
  const { filename } = req.params;
  await sendFileSecurely(req, res, filename);
});

router.get('/:userId/icon/:filename', checkUserId, userDirectory, async (req, res) => {
  const { filename } = req.params;
  const iconFilename = filename.replace(path.extname(filename), '_icon.png');
  await sendFileSecurely(req, res, iconFilename);
});

const fileExists = (filePath) => {
  return fsPromises.stat(filePath).then(() => true).catch(() => false);
};

router.delete('/:userId/:filename', checkUserId, userDirectory, async (req, res, next) => {
  const { filename } = req.params;
  const filePath = path.join(req.userDir, filename);
  const iconPath = filePath.replace(path.extname(filePath), '_icon.png');

  try {
    const [doesFileExist, doesIconExist] = await Promise.all([
      fileExists(filePath),
      fileExists(iconPath),
    ]);

    if (!doesFileExist && !doesIconExist) {
      logger.error('File does not exist.');
      return res.status(404).send({ error: 'File does not exist.' });
    }

    await Promise.all([
      doesFileExist ? fsPromises.unlink(filePath) : null,
      doesIconExist ? fsPromises.unlink(iconPath) : null,
    ]);

    res.status(200).send({ message: 'File and icon deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

router.use((error, req, res, next) => {
  if (error) {
    logger.error(error);
    const statusCode = error instanceof IconCreationError ? 422 : 500;
    res.status(statusCode).send({ error: 'An error occurred during file processing.', details: error.message });
  } else {
    next();
  }
});

export default router;
// controllers/FileController.mjs  
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { logger } from '../logger.mjs';

export class FileController {
    constructor(fileService) {
        this.fileService = fileService;
        this.upload = this.configureMulter();
    }

    configureMulter() {
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, req.userDir);
            },
            filename: (req, file, cb) => {
                const sanitizedName = this.fileService.sanitizeFilename(file.originalname);
                const fileExtension = path.extname(sanitizedName).toLowerCase();
                cb(null, `${uuidv4()}${fileExtension}`);
            }
        });

        const fileFilter = (req, file, cb) => {
            if (!this.fileService.isValidMimeType(file.mimetype)) {
                return cb(new Error('File type not allowed'), false);
            }

            if (!this.fileService.isValidFilename(file.originalname)) {
                return cb(new Error('Filename too long'), false);
            }

            cb(null, true);
        };

        return multer({
            storage,
            limits: {
                fileSize: this.fileService.FILE_SIZE_LIMIT,
                files: 1
            },
            fileFilter
        });
    }

    async uploadFile(req, res, next) {
        if (!req.file) {
            logger.error('No file uploaded.');
            return res.status(400).json({ error: 'No file uploaded.' });
        }

        let iconPath;
        try {
            iconPath = await this.fileService.createIcon(req.file.path, req.file.mimetype);

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
            await this.fileService.cleanupFiles(req.file.path, iconPath);
            next(error);
        }
    }

    async getFile(req, res) {
        const { userDir } = req;
        const { filename } = req.params;

        if (!this.fileService.validateFilePath(userDir, filename)) {
            logger.error('Attempt to access invalid file path.');
            return res.status(400).json({ error: 'Invalid file path.' });
        }

        const resolvedPath = path.join(userDir, filename);

        try {
            const exists = await this.fileService.checkFileExists(resolvedPath);
            if (!exists) {
                return res.status(404).json({ error: 'File not found.' });
            }

            // Disable caching  
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');

            res.sendFile(resolvedPath, { root: process.cwd() });
        } catch (err) {
            logger.error(`Error sending file: ${err.message}`);
            res.status(500).json({ error: 'Error sending file.' });
        }
    }

    async deleteFile(req, res, next) {
        try {
            await this.fileService.deleteFile(req.userDir, req.params.filename);
            res.json({ message: 'File and icon deleted successfully.' });
        } catch (err) {
            next(err);
        }
    }

    handleError(error, req, res, next) {
        if (error instanceof multer.MulterError) {
            switch (error.code) {
                case 'LIMIT_FILE_SIZE':
                    return res.status(413).json({
                        error: `File too large. Maximum size is ${this.fileService.FILE_SIZE_LIMIT / (1024 * 1024)}MB`
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
            const statusCode = error.name === 'IconCreationError' ? 422 : 500;
            return res.status(statusCode).json({
                error: 'An error occurred during file processing.',
                details: error.message
            });
        }
        next();
    }

    async checkUserId(req, res, next) {
        const { userId } = req.params;
        if (!userId || !/^[a-zA-Z0-9_-]+$/.test(userId)) {
            logger.error('Invalid or missing userId.');
            return res.status(400).json({ error: 'Invalid or missing userId.' });
        }
        next();
    }

    async setupUserDirectory(req, res, next) {
        try {
            req.userDir = await this.fileService.createUserDirectory(req.params.userId);
            next();
        } catch (err) {
            logger.error(`Error creating user directory: ${err.message}`);
            next(err);
        }
    }
}  
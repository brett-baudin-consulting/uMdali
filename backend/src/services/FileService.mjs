// services/FileService.mjs  
import path from 'path';
import sharp from 'sharp';
import { promises as fsPromises } from 'fs';
import { logger } from '../logger.mjs';

export class FileService {
    constructor() {
        this.FILE_SIZE_LIMIT = 10 * 1024 * 1024; // 10MB  
        this.ICON_SIZE = { width: 64, height: 64 };
        this.STANDARD_ICON_PATH = path.join('public', 'images', 'standard_icon.png');
        this.MAX_FILENAME_LENGTH = 255;
        this.ALLOWED_MIME_TYPES = new Set([
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/pdf',
        ]);
    }

    sanitizeFilename(filename) {
        const basename = path.basename(filename);
        return basename.replace(/[^a-zA-Z0-9-_\.]/g, '');
    }

    getUserDir(userId) {
        return path.join('uploads', userId);
    }

    async createUserDirectory(userId) {
        const userDir = this.getUserDir(userId);
        await fsPromises.mkdir(userDir, { recursive: true });
        return userDir;
    }

    async createIcon(filePath, mimeType) {
        if (!mimeType.startsWith('image/')) {
            return this.STANDARD_ICON_PATH;
        }

        const iconPath = filePath.replace(path.extname(filePath), '_icon.png');
        try {
            await sharp(filePath)
                .resize(this.ICON_SIZE)
                .toFile(iconPath);
            return iconPath;
        } catch (error) {
            logger.error(`Error creating icon: ${error.message}`);
            throw new IconCreationError(error.message);
        }
    }

    async cleanupFiles(filePath, iconPath) {
        const unlinkIfExists = async (path) => {
            try {
                await fsPromises.access(path);
                await fsPromises.unlink(path);
            } catch (error) {
                logger.error(`Cleanup error: ${error.message}`);
            }
        };

        await Promise.all([
            unlinkIfExists(filePath),
            iconPath ? unlinkIfExists(iconPath) : Promise.resolve()
        ]);
    }

    async deleteFile(userDir, filename) {
        const filePath = path.join(userDir, filename);
        const iconPath = filePath.replace(path.extname(filePath), '_icon.png');

        await this.cleanupFiles(filePath, iconPath);
    }

    validateFilePath(userDir, filePath) {
        const resolvedPath = path.join(userDir, filePath);
        const relativePath = path.relative(userDir, resolvedPath);

        return !(relativePath.startsWith('..') || path.isAbsolute(relativePath));
    }

    async checkFileExists(filePath) {
        try {
            await fsPromises.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    isValidMimeType(mimeType) {
        return this.ALLOWED_MIME_TYPES.has(mimeType);
    }

    isValidFileSize(size) {
        return size <= this.FILE_SIZE_LIMIT;
    }

    isValidFilename(filename) {
        return filename.length <= this.MAX_FILENAME_LENGTH;
    }
}

export default new FileService();

export class IconCreationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'IconCreationError';
    }
}  
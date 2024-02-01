import { promises as fs } from 'fs';
import { resolve } from 'path';
import { logger } from "../logger.mjs"; // Adjust the path as necessary

export async function encodeFileToBase64(relativeFilePath) {
  try {
    const absoluteFilePath = resolve(relativeFilePath);
    const fileBuffer = await fs.readFile(absoluteFilePath);
    const base64String = fileBuffer.toString('base64');
    return base64String;
  } catch (error) {
    logger.error('Error encoding file to base64:', error);
    throw error;
  }
}

export async function encodeFiles(messages) {
  for (const message of messages) {
    if (message.files) {
      for (const file of message.files) {
        file.base64 = await encodeFileToBase64(file.path);
      }
    }
  }
}
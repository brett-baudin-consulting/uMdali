import { connect } from 'mongoose';
import { logger } from './logger.mjs';
import dotenv from 'dotenv';
import loadModels from './config/loadModels.mjs';
import loadSpeechToTextModels from './config/loadSpeechToTextModels.mjs';

dotenv.config();

const MAX_RETRIES = 5;
let retries = 0;

if (!process.env.MONGODB_URI) {
  logger.error('MONGODB_URI is not defined in the environment variables.');
  process.exit(1);
}

const initDatabase = async () => {
  while (retries < MAX_RETRIES) {
    try {
      logger.info('Connecting to MongoDB');
      await connect(process.env.MONGODB_URI);
      logger.info('MongoDB Connected');
      logger.info('Loading models');
      await loadModels();
      logger.info('Models loaded');
      await loadSpeechToTextModels();
      logger.info('Speech to text models loaded');
      break; // Break the loop if connection is successful
    } catch (err) {
      logger.error(err);
      retries++;
      logger.info(`Retrying to connect... Attempt ${retries}/${MAX_RETRIES}`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds before retrying
    }
  }

  if (retries === MAX_RETRIES) {
    logger.error('Failed to connect to MongoDB after maximum retries');
    process.exit(1); // Exit the process with an error code
  }
};

export default initDatabase;
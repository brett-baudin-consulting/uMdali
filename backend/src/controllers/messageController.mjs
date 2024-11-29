import { logger } from "../logger.mjs";
import { MessageService } from "../services/MessageService.mjs";
import { messageAPIs } from "./messageAPIs.mjs";

const messageService = new MessageService(messageAPIs);
const TIMEOUT_MS = 30000; // 30 seconds  
let lastRequestTime = 0;

function validateRequest(req) {
  const { userDetails, message, model } = req.body;
  if (!userDetails?.settings) {
    const error = new Error('Missing userDetails.settings');
    error.statusCode = 400;
    throw error;
  }
  if (!message) {
    const error = new Error('Missing message');
    error.statusCode = 400;
    throw error;
  }
  if (!model?.vendor) {
    const error = new Error('Missing model.vendor');
    error.statusCode = 400;
    throw error;
  }
  return true;
}

function sanitizeOptions(settings) {
  return {
    maxTokens: Math.min(Math.max(1, settings.maxTokens || 100), 4000),
    temperature: Math.min(Math.max(0, settings.temperature || 0.7), 1),
  };
}

async function handleRequest(req, res) {

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => {
    abortController.abort();
    res.status(504).json({ error: 'Request timeout' });
  }, TIMEOUT_MS);

  // Set security headers    
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  try {
    validateRequest(req);

    const { userDetails: { settings }, message, stream, model } = req.body;
    const messageAPI = messageService.getAPI(model);

    const filteredMessages = await messageService.filterMessages(message);
    const processedMessages = messageService.prepareMessages(filteredMessages, model);

    const sanitizedSettings = sanitizeOptions(settings);
    const options = {
      userModel: model.name,
      maxTokens: sanitizedSettings.maxTokens,
      temperature: sanitizedSettings.temperature,
      isSupportsVision: Boolean(model.isSupportsVision),
    };

    if (stream) {
      await messageService.streamMessage(
        messageAPI,
        processedMessages,
        options,
        res,
        abortController.signal
      );
    } else {
      const content = await messageService.sendMessage(
        messageAPI,
        processedMessages,
        options,
        abortController.signal
      );
      res.json({ content });
    }
  } catch (error) {
    logger.error("Error handling request:", error);
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({
        error: error.message || 'Internal server error'
      });
    }
  } finally {
    clearTimeout(timeoutId);
    abortController.abort();
  }
}

export default handleRequest;
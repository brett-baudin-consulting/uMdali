import { logger } from "../logger.mjs";
import { MessageService } from "../services/MessageService.mjs";
import { messageAPIs } from "./messageAPIs.mjs";

const messageService = new MessageService(messageAPIs);
const TIMEOUT_MS = 60000; // 60 seconds

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
  let timeoutId;

  // Set security headers before any potential response  
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'no-store');

  // Create a promise that rejects on timeout  
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      abortController.abort();
      reject(new Error('Request timeout'));
    }, TIMEOUT_MS);
  });

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

    // Race between the actual request and timeout  
    await Promise.race([
      stream
        ? messageService.streamMessage(
          messageAPI,
          processedMessages,
          options,
          res,
          abortController.signal
        )
        : messageService.sendMessage(
          messageAPI,
          processedMessages,
          options,
          abortController.signal
        ).then(content => {
          if (!res.headersSent) {
            res.json({ content });
          }
        }),
      timeoutPromise
    ]);

  } catch (error) {
    logger.error("Error handling request:", error);
    if (!res.headersSent) {
      const statusCode = error.message === 'Request timeout' ? 504 : (error.statusCode || 500);
      res.status(statusCode).json({
        error: error.message || 'Internal server error'
      });
    }
  } finally {
    clearTimeout(timeoutId);
    abortController.abort();
  }
}

export default handleRequest;  
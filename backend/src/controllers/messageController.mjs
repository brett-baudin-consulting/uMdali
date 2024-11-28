import { logger } from "../logger.mjs";
import { MessageService } from "../services/messageService.mjs";
import { messageAPIs } from "./messageAPIs.mjs";

const messageService = new MessageService(messageAPIs);

function validateRequest(req) {
  const { userDetails, message, model } = req.body;
  if (!userDetails?.settings || !message || !model?.vendor) {
    throw new Error('Missing required fields: userDetails.settings, message, or model.vendor');
  }
  return true;
}

async function handleRequest(req, res) {
  try {
    validateRequest(req);

    const { userDetails: { settings }, message, stream, model } = req.body;
    const messageAPI = messageService.getAPI(model);

    if (!messageAPI) {
      return res.status(400).json({
        error: `Unsupported API: ${model?.vendor}/${model?.name}`
      });
    }

    const filteredMessages = await messageService.filterMessages(message);
    const processedMessages = messageService.prepareMessages(filteredMessages, model);

    const options = {
      userModel: model.name,
      maxTokens: settings.maxTokens,
      temperature: settings.temperature,
      isSupportsVision: model.isSupportsVision,
    };

    const abortController = new AbortController();

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
    res.status(error.statusCode || 500).json({
      error: error.message || 'Internal server error'
    });
  }
}

export default handleRequest;  
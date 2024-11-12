import { logger } from "../logger.mjs";
import OpenAIMessageAPI from "../messageAPIs/OpenAIMessageAPI.mjs";
import ClaudeMessageAPI from "../messageAPIs/ClaudeMessageAPI.mjs";
import GeminiMessageAPI from "../messageAPIs/GeminiMessageAPI.mjs";
import MistralMessageAPI from "../messageAPIs/MistralAIMessageAPI.mjs";
import GroqMessageAPI from "../messageAPIs/GroqMessageAPI.mjs";
import OllamaOpenAIMessageAPI from "../messageAPIs/OllamaOpenAIMessageAPI.mjs";
import RekaMessageAPI from "../messageAPIs/RekaMessageAPI.mjs";

export const messageAPIs = {
  ollama: new OllamaOpenAIMessageAPI(),
  anthropic: new ClaudeMessageAPI(),
  openai: new OpenAIMessageAPI(),
  google: new GeminiMessageAPI(),
  mistral: new MistralMessageAPI(),
  groq: new GroqMessageAPI(),
  reka: new RekaMessageAPI(),
};

// Dynamic import of filters
async function getFilters() {
  const filterNames = (process.env.FILTERS || "").split(",").filter(Boolean);
  const filters = [];

  for (const name of filterNames) {
    try {
      const filterModule = await import(`../filters/${name}.mjs`);
      const FilterClass = filterModule.default;
      filters.push(new FilterClass());
    } catch (err) {
      logger.warn(`Unable to load filter: ${name} - ${err.message}`);
    }
  }

  return filters;
}

async function sendMessageToAPI(messageAPI, message, options, signal) {
  try {
    return await messageAPI.sendRequest(message, signal, options);
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.info('Request was aborted');
      return; // Optionally return a specific value or simply exit
    }
    logger.error("Error sending request to message API:", error);
    throw error;
  }
}

async function sendMessageToAPIStreamResponse(messageAPI, message, options, res, signal) {
  try {
    return await messageAPI.sendRequestStreamResponse(message, res, signal, options);
  } catch (error) {
    if (error.name === 'AbortError') {
      logger.info('Stream request was aborted');
      return; // Optionally return a specific value or simply exit
    }
    logger.error("Error sending request to message API:", error);
    throw error;
  }
}

async function filterMessages(messages, res) {
  let filters;
  try {
    filters = await getFilters();
  } catch (error) {
    res.status(500).send({ error: `Failed to load filters: ${error.message}` });
    return;
  }
  try {
    for (const filter of filters) {
      for (const message of messages) {
        message.content = await filter.process(message.content);
      }
    }
    return messages;
  } catch (error) {
    res.status(400).send({ error: `Failed to apply filter ${error}` });
    return;
  }
}

function getAPI(model) {
  let models = ["ollama", "google", "ollama", "openai", "mistral", "anthropic", "groq", "reka"];
  let modelImplementation = models.find(m => model?.vendor?.toLowerCase() === m);
  return messageAPIs[modelImplementation];
}

async function handleRequest(req, res) {
  const { userDetails: { settings }, message, stream, model } = req.body;
  const messageAPI = getAPI(model);
  if (!messageAPI) {
    res.status(400).send({ error: `Unsupported API: ${model?.vendor}/${model?.name}` });
    return;
  }

  let messages;
  try {  
    messages = await filterMessages(message);
  
    // Filter out messages with role 'tool'  
    messages = messages.filter(msg => msg.role !== 'tool');
  
    // Additional filter if model does not support context  
    if (!model.isSupportsContext) {  
      messages = messages.filter(msg => msg.role !== 'context');  
    }  
  } catch (error) {  
    res.status(error.statusCode || 500).send({ error: error.message });  
    return;  
  }  

  const options = {
    userModel: model.name,
    maxTokens: settings.maxTokens,
    temperature: settings.temperature,
    isSupportsVision: model.isSupportsVision,
  };

  const abortController = new AbortController();
  const { signal } = abortController;

  try {
    if (stream) {
      await sendMessageToAPIStreamResponse(messageAPI, messages, options, res, signal);
    } else {
      const content = await sendMessageToAPI(messageAPI, messages, options, signal);
      res.send({ content });
    }
  } catch (error) {
    logger.error("Error handling request:", error);
    res.status(500).send({ error: error.message });
  }
}

export default handleRequest;
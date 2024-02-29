import { logger } from "../logger.mjs";
import OpenAIMessageAPI from "../messageAPIs/OpenAIMessageAPI.mjs";
import ClaudeMessageAPI from "../messageAPIs/ClaudeMessageAPI.mjs";
import GeminiMessageAPI from "../messageAPIs/GeminiMessageAPI.mjs";
import OllamaMessageAPI from "../messageAPIs/OllamaAIMessageAPI.mjs";
import MistralMessageAPI from "../messageAPIs/MistralAIMessageAPI.mjs";
import GroqMessageAPI from "../messageAPIs/GroqMessageAPI.mjs";

export const messageAPIs = {
  claude: new ClaudeMessageAPI(),
  gpt: new OpenAIMessageAPI(),
  gemini: new GeminiMessageAPI(),
  ollama: new OllamaMessageAPI(),
  mistral: new MistralMessageAPI(),
  groq: new GroqMessageAPI(),
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
    logger.error("Error sending request to message API:", error);
    throw error;
  }
}

async function sendMessageToAPIStreamResponse(
  messageAPI,
  message,
  options,
  res,
  signal
) {
  try {
    return await messageAPI.sendRequestStreamResponse(message, res, signal, options);
  } catch (error) {
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

function getAPI(req) {
  let models = ["gemini", "ollama", "gpt", "mistral", "claude", "groq"];
  let model = models.find(m => req.body.userDetails.settings.model.includes(m));
  return messageAPIs[model];
}

async function handleRequest(req, res) {
  const { userDetails: { settings }, message, stream } = req.body;
  const messageAPI = getAPI(req);
  if (!messageAPI) {
    res.status(400).send({ error: `Unsupported API: ${settings.model}` });
    return;
  }

  let messages;
  try {
    messages = await filterMessages(message);
  } catch (error) {
    res.status(error.statusCode || 500).send({ error: error.message });
    return;
  }

  const options = {
    userModel: settings.model,
    maxTokens: settings.maxTokens,
    temperature: settings.temperature,
    isSupportsVision: settings.model.includes("vision"),
  };

  const abortController = new AbortController();
  const { signal } = abortController;
  res.on("close", () => {
    abortController.abort();
  });

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
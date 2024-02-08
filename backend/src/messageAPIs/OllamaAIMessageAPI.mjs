import { logger } from "../logger.mjs";
import fetch from "node-fetch";
import { TextDecoder } from "util";
import MessageAPI from "./MessageAPI.mjs";

const { OLLAMA_MODEL, OLLAMA_API_URL } =
  process.env;

const checkEnvVariables = () => {
  if (!OLLAMA_MODEL || !OLLAMA_API_URL) {
    logger.error("Environment variables are not set correctly.");
  }
};

checkEnvVariables();

function messageToOllamaFormat(messages) {
  return messages.map(({ messageId, modelName, files, ...message }) => ({
    ...message,
    role: message.role === "bot" ? "assistant" : message.role === "context" ? "system" : message.role,
  }));
}

class OllamaMessageAPI extends MessageAPI {
  constructor() {
    super();
    this.MODEL = OLLAMA_MODEL;
  }

  _prepareHeaders() {
    return {
      "Content-Type": "application/json",
    };
  }

  _prepareOptions(body, signal) {
    return {
      method: "POST",
      headers: this._prepareHeaders(),
      body: JSON.stringify(body),
      signal: signal,
    };
  }
  async sendRequest(messages, signal, options = {}) {
    const { userModel } = options;
    const updatedMessages = messageToOllamaFormat(messages);
    const parts = userModel.split('/');
    const model = parts[1];
    const requestOptions = this._prepareOptions({
      model: model || this.MODEL,
      messages: updatedMessages,
      stream: false,
    });

    try {
      const response = await fetch(OLLAMA_API_URL, requestOptions, signal);

      if (!response.ok) {
        const text = await response.text();
        logger.error("Ollama API response error: ", text);
        throw new Error(`Ollama API Error: ${text}`);
      }

      const data = await response.json();
      const content = data?.message?.content;
      return content;
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.error("Fetch aborted:", err);
      } else {
        logger.error("Error sending request:", err);
      }
      throw err;
    }
  }

  async sendRequestStreamResponse(messages, resClient, signal, options = {}) {

    const { userModel } = options;
    const updatedMessages = messageToOllamaFormat(messages);
    const parts = userModel.split('/');
    const model = parts[1];
    const requestOptions = this._prepareOptions({
      model: model || this.MODEL,
      messages: updatedMessages,
      stream: true,
    });

    try {
      const response = await fetch(OLLAMA_API_URL
        , requestOptions, signal);

      if (!response.ok) {
        const text = await response.text();
        logger.error("Ollama API response error: ", text);
        throw new Error(`Ollama API Error: ${text}`);
      }

      const textDecoder = new TextDecoder();

      for await (const chunk of response.body) {

        let decodedChunk = textDecoder.decode(chunk, { stream: true });
        const parsedLine = JSON.parse(decodedChunk);
        if (parsedLine?.done === true) {
          resClient.end();
          return;
        }
        if (parsedLine?.message.content) {
          resClient.write(parsedLine?.message.content);
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.error("Fetch aborted:", err);
      } else {
        logger.error("Error sending stream response:", err);
      }
      // Do not rethrow the error if it's an AbortError since it's expected behavior
      if (err.name !== 'AbortError') {
        throw err;
      }
    }
  }
}

export default OllamaMessageAPI;


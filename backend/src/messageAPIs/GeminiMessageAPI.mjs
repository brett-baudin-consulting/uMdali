import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../logger.mjs";
import MessageAPI from "./MessageAPI.mjs";
import { encodeFiles } from './FileEncoder.mjs';

const API_KEY = process.env.GEMINI_API_KEY;
const DEFAULT_MODEL = "gemini-1.5-pro";

if (!API_KEY) {
  throw new Error("Gemini API key environment variable is not set.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

class GeminiMessageAPI extends MessageAPI {
  async _getModel(options) {
    const modelName = options.userModel || DEFAULT_MODEL;
    return genAI.getGenerativeModel({ model: modelName });
  }

  _createMessageParts(message) {
    const parts = [];

    // Add files if they exist  
    if (message.files?.length) {
      message.files.forEach(file => {
        parts.push({
          inlineData: {
            mimeType: file.type,
            data: file.base64
          }
        });
      });
    }

    // Add text content if it exists  
    if (message.content) {
      parts.push({ text: message.content });
    }

    return parts;
  }

  async _prepareContent(messages, options) {
    const { isSupportsVision } = options;
    if (isSupportsVision) {
      await encodeFiles(messages);
    }

    // Separate context/system messages from regular messages  
    const systemMessages = messages.filter(msg => msg.role === 'context');
    const chatMessages = messages.filter(msg => msg.role !== 'context');

    return {
      systemPrompt: systemMessages.map(msg => msg.content).join('\n'),
      history: chatMessages.map(message => ({
        role: message.role === 'bot' ? 'model' : message.role === 'user' ? 'user' : 'system',
        parts: this._createMessageParts(message)
      }))
    };
  }

  async sendRequest(messages, signal, options = {}) {
    try {
      const { temperature = 0.7 } = options;
      const { systemPrompt, history } = await this._prepareContent(messages, options);
      const model = await this._getModel(options);

      const chat = model.startChat({
        history,
        generationConfig: {
          temperature,
        },
        ...(systemPrompt && { context: systemPrompt })
      });

      // Get the last message's parts  
      const lastMessage = history[history.length - 1];
      const result = await chat.sendMessage(lastMessage.parts);
      return result.response.text();
    } catch (err) {
      logger.error("Error in sendRequest:", err);
      throw err;
    }
  }

  async sendRequestStreamResponse(messages, resClient, signal, options = {}) {
    try {
      const { temperature = 0.7 } = options;
      const { systemPrompt, history } = await this._prepareContent(messages, options);
      const model = await this._getModel(options);

      const chat = model.startChat({
        history,
        generationConfig: {
          temperature,
        },
        ...(systemPrompt && { context: systemPrompt })
      });

      // Get the last message's parts  
      const lastMessage = history[history.length - 1];
      const result = await chat.sendMessageStream(lastMessage.parts);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          await new Promise(resolve => resClient.write(chunkText, resolve));
        }
      }

      resClient.end();
    } catch (err) {
      logger.error("Error in sendRequestStreamResponse:", err);
      if (err.name !== 'AbortError') {
        throw err;
      }
    }
  }
}

export default GeminiMessageAPI;  
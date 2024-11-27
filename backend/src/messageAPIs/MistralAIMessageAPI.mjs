import { logger } from "../logger.mjs";
import { Mistral } from "@mistralai/mistralai";
import jsonata from "jsonata";
import MessageAPI from "./MessageAPI.mjs";
import { promises as fs } from 'fs';
import { resolve } from 'path';

async function encodeFileToBase64(relativeFilePath) {
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

async function encodeFiles(messages) {
  for (const message of messages) {
    if (message.files) {
      for (const file of message.files) {
        file.base64 = await encodeFileToBase64(file.path);
      }
    }
  }
}

// JSONata expressions  
const transformWithVision = `  
$map($, function($message) {  
  {  
      "role": $message.role = 'bot' ? 'assistant' :  
              $message.role = 'context' ? 'system' :  
              $message.role,  
      "content": [  
          {  
            "type": "text",   
            "text": $message.content  
          },  
          $map($message.files, function($file) {  
              {"image_url":   
                {  
                  "url": "data:image/jpeg;base64,"&$file.base64  
                }  
              }  
          })  
      ]  
  }  
})[]  
`;

const transformWithoutVision = `  
$map($, function($message) {  
  {  
      "role": $message.role = 'bot' ? 'assistant' :  
              $message.role = 'context' ? 'system' :  
              $message.role,  
      "content": $message.content  
  }  
})[]  
`;

async function messageToMistralAIFormat(messages, isSupportsVision) {
  const transform = jsonata(isSupportsVision ? transformWithVision : transformWithoutVision);
  return await transform.evaluate(messages);
}

const { MISTRALAI_API_KEY: MISTRALAI_API_KEY } = process.env;

const checkEnvVariables = () => {
  if (!MISTRALAI_API_KEY) {
    throw new Error("Mistral API key is not set correctly.");
  }
};

checkEnvVariables();

class MistralAIMessageAPI extends MessageAPI {
  constructor() {
    super();
    this.client = new Mistral({ apiKey: MISTRALAI_API_KEY });
    this.API_KEY = MISTRALAI_API_KEY;
    this.MODEL = 'mistral-tiny';
  }

  async sendRequest(messages, signal, options = {}) {
    const { userModel, maxTokens, temperature, isSupportsVision } = options;

    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    if (isSupportsVision) {
      await encodeFiles(messages);
    }

    const updatedMessages = await messageToMistralAIFormat(messages, isSupportsVision);

    try {
      const abortPromise = new Promise((_, reject) => {
        signal?.addEventListener('abort', () =>
          reject(new Error('Request aborted')));
      });

      const responsePromise = this.client.chat.complete({
        model: userModel || this.MODEL,
        messages: updatedMessages,
        maxTokens: maxTokens,
        temperature: temperature,
      });

      const response = await Promise.race([responsePromise, abortPromise]);
      return response.choices[0].message.content;
    } catch (err) {
      if (err.message === 'Request aborted') {
        logger.error("Request aborted:", err);
        const abortError = new Error('AbortError');
        abortError.name = 'AbortError';
        throw abortError;
      }
      logger.error("Error sending request:", err);
      throw err;
    }
  }

  async sendRequestStreamResponse(messages, resClient, signal, options = {}) {
    const { userModel, maxTokens, temperature, isSupportsVision } = options;

    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    if (isSupportsVision) {
      await encodeFiles(messages);
    }

    const updatedMessages = await messageToMistralAIFormat(messages, isSupportsVision);

    try {
      const stream = await this.client.chat.stream({
        model: userModel || this.MODEL,
        messages: updatedMessages,
        maxTokens: maxTokens,
        temperature: temperature,
      });

      signal?.addEventListener('abort', () => {
        resClient.end();
      });

      for await (const event of stream) {
        if (signal?.aborted) break;

        const content = event.data?.choices[0]?.delta.content;
        if (!content) continue;

        resClient.write(content);
      }

      if (!signal?.aborted) {
        resClient.end();
      }
    } catch (err) {
      this.handleStreamError(err);
    }
  }

  handleStreamError(err) {
    if (err.message === 'Request aborted') {
      logger.error("Stream aborted:", err);
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      throw abortError;
    }
    logger.error("Error sending stream response:", err);
    throw err;
  }
}

export default MistralAIMessageAPI;  
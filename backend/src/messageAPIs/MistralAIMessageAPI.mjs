// MistralAIMessageAPI.jsx  
import { logger } from "../logger.mjs";
import { Mistral } from "@mistralai/mistralai";
import jsonata from "jsonata";
import MessageAPI from "./MessageAPI.mjs";
import { promises as fs } from 'fs';
import { resolve } from 'path';

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
                {    
                  "type": "image_url",    
                  "image_url":"data:image/jpeg;base64,"&$file.base64    
                }    
            })    
        ]    
    }    
  })[]`;

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

class MistralAIMessageAPI extends MessageAPI {
  constructor() {
    super();
    if (!process.env.MISTRALAI_API_KEY) {
      throw new Error("Mistral API key is not set correctly.");
    }
    this.client = new Mistral({ apiKey: process.env.MISTRALAI_API_KEY });
    this.MODEL = 'mistral-tiny';
  }

  getRequestConfig(userModel, maxTokens, temperature, isSupportsVision, messages) {
    const config = {
      model: userModel || this.MODEL,
      messages,
    };

    if (temperature !== undefined) {
      config.temperature = temperature;
    }

    if (maxTokens) {
      config.max_tokens = maxTokens;
    }

    return config;
  }

  async sendRequest(messages, signal, options = {}) {
    const { userModel, maxTokens, temperature, isSupportsVision } = options;

    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    if (isSupportsVision) {
      await this.encodeFiles(messages);
    }

    const updatedMessages = await this.messageToMistralAIFormat(messages, isSupportsVision);

    try {
      const abortPromise = new Promise((_, reject) => {
        signal?.addEventListener('abort', () => reject(new Error('Request aborted')));
      });

      const config = this.getRequestConfig(
        userModel,
        maxTokens,
        temperature,
        isSupportsVision,
        updatedMessages
      );

      const responsePromise = this.client.chat.complete(config);
      const response = await Promise.race([responsePromise, abortPromise]);

      return response.choices[0].message.content;
    } catch (err) {
      this.handleError(err);
    }
  }

  async sendRequestStreamResponse(messages, resClient, signal, options = {}) {
    const { userModel, maxTokens, temperature, isSupportsVision } = options;

    if (signal?.aborted) {
      throw new Error('Request aborted');
    }

    if (isSupportsVision) {
      await this.encodeFiles(messages);
    }

    const updatedMessages = await this.messageToMistralAIFormat(messages, isSupportsVision);

    try {
      const config = this.getRequestConfig(
        userModel,
        maxTokens,
        temperature,
        isSupportsVision,
        updatedMessages
      );
      console.log(JSON.stringify(config));
      const stream = await this.client.chat.stream(config);

      signal?.addEventListener('abort', () => {
        resClient.end();
      });

      for await (const event of stream) {
        if (signal?.aborted) break;

        const content = event.data?.choices[0]?.delta.content;
        if (content) {
          resClient.write(content);
        }
      }

      if (!signal?.aborted) {
        resClient.end();
      }
    } catch (err) {
      this.handleStreamError(err);
    }
  }

  async encodeFiles(messages) {
    for (const message of messages) {
      if (message.files) {
        for (const file of message.files) {
          file.base64 = await this.encodeFileToBase64(file.path);
        }
      }
    }
  }

  async encodeFileToBase64(relativeFilePath) {
    try {
      const absoluteFilePath = resolve(relativeFilePath);
      const fileBuffer = await fs.readFile(absoluteFilePath);
      return fileBuffer.toString('base64');
    } catch (error) {
      logger.error('Error encoding file to base64:', error);
      throw error;
    }
  }

  async messageToMistralAIFormat(messages, isSupportsVision) {
    const transform = jsonata(isSupportsVision ? transformWithVision : transformWithoutVision);
    return await transform.evaluate(messages);
  }

  handleError(err) {
    if (err.message === 'Request aborted') {
      logger.error("Request aborted:", err);
      const abortError = new Error('AbortError');
      abortError.name = 'AbortError';
      throw abortError;
    }
    logger.error("Error sending request:", err);
    throw err;
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
import OpenAI from 'openai';
import jsonata from "jsonata";
import { logger } from "../logger.mjs";
import { encodeFiles } from './FileEncoder.mjs';
import MessageAPI from "./MessageAPI.mjs";

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
                "image_url":   
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

async function messageToOpenAIFormat(messages, isSupportsVision) {
  const transform = jsonata(isSupportsVision ? transformWithVision : transformWithoutVision);
  return await transform.evaluate(messages);
}

const { OPENAI_API_KEY } = process.env;

if (!OPENAI_API_KEY) {
  throw new Error("OpenAI API key is not set.");
}

class OpenAIMessageAPI extends MessageAPI {
  constructor() {
    super();
    this.client = new OpenAI({
      apiKey: OPENAI_API_KEY,
    });
  }

  async sendRequest(messages, signal, options = {}) {
    const { userModel, maxTokens, temperature, isSupportsVision } = options;

    try {
      if (isSupportsVision) {
        await encodeFiles(messages);
      }

      const updatedMessages = await messageToOpenAIFormat(messages, isSupportsVision);

      const response = await this.client.chat.completions.create({
        model: userModel,
        messages: updatedMessages,
        max_tokens: maxTokens,
        temperature: temperature,
      }, { signal });

      return response.choices[0].message.content;
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.error("Request aborted:", err);
        throw err;
      }
      logger.error("Error sending request:", err);
      throw new Error(`OpenAI API Error: ${err.message}`);
    }
  }

  async sendRequestStreamResponse(messages, resClient, signal, options = {}) {
    const { userModel, maxTokens, temperature, isSupportsVision } = options;

    try {
      if (isSupportsVision) {
        await encodeFiles(messages);
      }

      const updatedMessages = await messageToOpenAIFormat(messages, isSupportsVision);

      const stream = await this.client.chat.completions.create({
        model: userModel,
        messages: updatedMessages,
        max_tokens: maxTokens,
        temperature: temperature,
        stream: true,
      }, { signal });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          resClient.write(content);
        }
      }

      resClient.end();
    } catch (err) {
      if (err.name === 'AbortError') {
        logger.error("Stream aborted:", err);
        return; // Don't throw for aborted requests  
      }
      logger.error("Error sending stream response:", err);
      throw new Error(`OpenAI API Stream Error: ${err.message}`);
    }
  }
}

export default OpenAIMessageAPI;  
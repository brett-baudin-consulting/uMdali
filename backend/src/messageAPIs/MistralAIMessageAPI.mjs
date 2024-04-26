import { logger } from "../logger.mjs";
import fetch from "node-fetch";
import jsonata from "jsonata";
import { TextDecoder } from "util";
import MessageAPI from "./MessageAPI.mjs";
import { promises as fs } from 'fs';
import { resolve } from 'path';

async function encodeFileToBase64(relativeFilePath) {
  try {
    // Resolve the relative path to an absolute path
    const absoluteFilePath = resolve(relativeFilePath);

    // Read the file content as a Buffer
    const fileBuffer = await fs.readFile(absoluteFilePath);

    // Convert the Buffer to a base64 string
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
// JSONata expression
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
  if (!isSupportsVision) {
    const transform = jsonata(transformWithoutVision);
    const openai = await transform.evaluate(messages);
    return openai;
  }
  const transform = jsonata(transformWithVision);
  const openai = await transform.evaluate(messages);
  return openai;
}

const { MISTRALAI_API_KEY, MISTRALAI_API_URL } =
  process.env;

const checkEnvVariables = () => {
  if (!MISTRALAI_API_KEY || !MISTRALAI_API_URL) {
    throw new Error("Mistral environment variables are not set correctly.");
  }

};

async function handleApiErrorResponse(response) {
  const text = await response.text();
  let parsedText;
  try {
    parsedText = JSON.parse(text);
  } catch (error) {
    // If JSON parsing fails, use the original text
    parsedText = text;
  }

  // Log the error
  logger.error("Mistral API response error: ", parsedText);

  // Throw an error with a message, checking if parsedText is an object and has an error.message
  const errorMessage = `Mistral API Error: ${parsedText?.error?.message || parsedText?.message || 'Unknown error occurred'}`;
  throw new Error(errorMessage);
}

checkEnvVariables();

class MistralAIMessageAPI extends MessageAPI {
  constructor() {
    super();
    this.API_KEY = MISTRALAI_API_KEY;
  }

  _prepareHeaders() {
    return {
      Authorization: `Bearer ${this.API_KEY}`,
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
    const { userModel, maxTokens, temperature, isSupportsVision } = options;
    if (isSupportsVision) {
      await encodeFiles(messages);
    }
    const updatedMessages = await messageToMistralAIFormat(messages, isSupportsVision);
    const requestOptions = this._prepareOptions({
      model: userModel || this.MODEL,
      messages: updatedMessages,
      max_tokens: maxTokens,
      temperature: temperature,
    }, signal);

    try {
      const response = await fetch(MISTRALAI_API_URL, requestOptions, signal);

      if (!response.ok) {
        await handleApiErrorResponse(response);
      }

      const data = await response.json();
      const content = data?.choices?.[0]?.message?.content;
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
    const { userModel, maxTokens, temperature, isSupportsVision } = options;
    if (isSupportsVision) {
      await encodeFiles(messages);
    }
    const updatedMessages = await messageToMistralAIFormat(messages, isSupportsVision);

    const requestOptions = this._prepareOptions({
      model: userModel,
      messages: updatedMessages,
      max_tokens: maxTokens,
      temperature: temperature,
      stream: true,
    }, signal);

    try {
      const response = await fetch(MISTRALAI_API_URL, requestOptions, signal);

      if (!response.ok) {
        await handleApiErrorResponse(response);
      }

      await this.processResponseStream(response, resClient);
    } catch (err) {
      this.handleStreamError(err);
    }
  }

  async processResponseStream(response, resClient) {
    const textDecoder = new TextDecoder();
    let lastChunk = "";

    for await (const chunk of response.body) {
      let decodedChunk = textDecoder.decode(chunk, { stream: true });
      if (!decodedChunk.startsWith("data:")) {
        decodedChunk = lastChunk + decodedChunk;
      }
      const lines = decodedChunk.split("\n");
      lastChunk = this.handleStreamedContent(lines, resClient, lastChunk);
    }
  }

  handleStreamedContent(lines, resClient, lastChunk) {
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const content = line.replace(/^data: /, "").trim();
        if (content === "[DONE]") {
          resClient.end();
          return ""; // Return an empty string as the lastChunk for the next iteration
        }
        try {
          const parsedLine = JSON.parse(content);
          if (parsedLine?.choices?.[0]?.delta?.content) {
            resClient.write(parsedLine.choices[0].delta.content);
          }
        } catch (error) {
          lastChunk = line; // Keep the partial line for the next iteration
        }
      }
    }
    return lastChunk; // Return the lastChunk for the next iteration
  }

  handleStreamError(err) {
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

export default MistralAIMessageAPI;

import fetch from "node-fetch";
import jsonata from "jsonata";
import { TextDecoder } from "util";

import MessageAPI from "./MessageAPI.mjs";
import { logger } from "../logger.mjs";
import { encodeFiles } from './FileEncoder.mjs';

// JSONata expression
const transformWithVision = `

`;
const transformWithoutVision = `
$map($, function($message) {
  {
      "type": $message.role = 'bot' ? 'model' :
              'human',
      "text": $message.content
  }
})[]
`;
async function messageToRekaAIFormat(messages, isSupportsVision) {
  if (!isSupportsVision) {
    const transform = jsonata(transformWithoutVision);
    const reka = await transform.evaluate(messages);
    return reka;
  }
  const transform = jsonata(transformWithVision);
  const reka = await transform.evaluate(messages);
  return reka;
}

const { REKAAI_API_KEY, REKAAI_API_URL } =
  process.env;

const checkEnvVariables = () => {
  if (!REKAAI_API_KEY || !REKAAI_API_URL) {
    throw new Error("REKAAI Environment variables are not set correctly.");
  }
};

checkEnvVariables();

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
  logger.error("RekaAI API response error: ", parsedText);

  // Throw an error with a message, checking if parsedText is an object and has an error.message
  const errorMessage = `RekaAI API Error: ${parsedText?.error?.message || 'Unknown error occurred'}`;
  throw new Error(errorMessage);
}

class RekaAIMessageAPI extends MessageAPI {
  constructor() {
    super();
    this.API_KEY = REKAAI_API_KEY;
  }

  _prepareHeaders() {
    return {
      "X-Api-Key": `${this.API_KEY}`,
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
    const updatedMessages = await messageToRekaAIFormat(messages, isSupportsVision);
    const requestOptions = this._prepareOptions({
      model_name: userModel,
      conversation_history: updatedMessages,
      request_output_len: maxTokens,
      temperature: temperature,
    }, signal);
    try {
      const response = await fetch(REKAAI_API_URL, requestOptions, signal);

      if (!response.ok) {
        await handleApiErrorResponse(response);
      }

      const data = await response.json();
      const content = data?.text;
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
    const updatedMessages = await messageToRekaAIFormat(messages, isSupportsVision);
    const requestOptions = this._prepareOptions({
      model: userModel,
      messages: updatedMessages,
      max_tokens: maxTokens,
      temperature: temperature,
      stream: true,
    }, signal);
    try {
      const response = await fetch(REKAAI_API_URL, requestOptions, signal);
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

export default RekaAIMessageAPI;

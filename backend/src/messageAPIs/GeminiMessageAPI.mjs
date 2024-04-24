import jsonata from "jsonata";
import fetch from "node-fetch";
import { TextDecoder } from "util";

import { logger } from "../logger.mjs";
import MessageAPI from "./MessageAPI.mjs";
import { encodeFiles } from './FileEncoder.mjs';

const { GEMINI_MODEL, GEMINI_API_KEY, GEMINI_MAX_TOKENS, GEMINI_TEMPERATURE, GEMINI_API_URL } =
  process.env;

async function handleApiErrorResponse(response) {
  try {
    const text = await response.text();
    const parsedText = JSON.parse(text);
    logger.error("Gemini API response error: ", parsedText);
    const errorMessage = `Gemini API Error: ${parsedText[0]?.error?.message || parsedText?.error?.message || parsedText}`;
    throw new Error(errorMessage);
  } catch (error) {
    logger.error("Failed to parse response: ", error);
    throw new Error("Failed to handle API error response.");
  }
}

// JSONata expression
const transformWithVision = `
{
  "contents": $map(*[role != 'context'], function($v, $i, $a) {
    {
      "role": $v.role = 'bot' ? 'model' : $v.role,
      "parts":[ 
          $map($v.files, function($file) {
              {
                "inlineData": {
                  "mimeType": $file.type,
                  "data": $file.base64
                }
              }
          }),{
        "text": $v.content
      }
    ]
    }
  }),
    "systemInstruction": $map(*[role = 'context'], function($v, $i, $a) {
    {
      "role": $v.role = 'bot' ? 'model' : $v.role,
      "parts":[ 
          $map($v.files, function($file) {
              {
                "inlineData": {
                  "mimeType": $file.type,
                  "data": $file.base64
                }
              }
          }),{
        "text": $v.content
      }
    ]
    }
  }),
  "generation_config": {}
}
`;
const transformWithoutVision = `
{
  "contents": $map(*[role != 'context'], function($v, $i, $a) {
    {
      "role": $v.role = 'bot' ? 'model' : $v.role,
      "parts": {
        "text": $v.content
      }
    }
  }),
  "generation_config": {}
}
`;

async function messageToGeminiFormat(messages, isSupportsVision) {
  if (!isSupportsVision) {
    const transform = jsonata(transformWithoutVision);
    const gemini = await transform.evaluate(messages);
    return gemini;
  }
  const transform = jsonata(transformWithVision);
  const gemini = await transform.evaluate(messages);
  return gemini;
}

class GeminiMessageAPI extends MessageAPI {
  constructor(userModel) {
    super();
    const envValues = this._checkEnvVariables();
    this.MODEL = userModel || GEMINI_MODEL;
    this.API_KEY = GEMINI_API_KEY;
    this.TEMPERATURE = envValues.temperature;
    this.MAX_TOKENS = envValues.maxTokens;
  }

  _checkEnvVariables() {
    if (!GEMINI_MODEL || !GEMINI_API_KEY || !GEMINI_MAX_TOKENS || !GEMINI_TEMPERATURE) {
      throw new Error("Environment variables are not set correctly.");
    }

    const temperature = parseFloat(GEMINI_TEMPERATURE);
    const maxTokens = parseInt(GEMINI_MAX_TOKENS, 10);
    if (Number.isNaN(maxTokens) || Number.isNaN(temperature)) {
      throw new Error("Invalid GEMINI_MAX_TOKENS or GEMINI_TEMPERATURE environment variable value.");
    }

    return { temperature, maxTokens };
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
    const { userModel, maxTokens, temperature, isSupportsVision } = options;
    if (isSupportsVision) {
      await encodeFiles(messages);
    }
    const updatedMessages = await messageToGeminiFormat(messages, isSupportsVision);

    const requestOptions = this._prepareOptions({
      contents: updatedMessages.contents,
      systemInstruction: updatedMessages.systemInstruction,
      generation_config: {
        temperature: temperature || this.TEMPERATURE,
        maxOutputTokens: maxTokens || this.MAX_TOKENS,
      }
    }, signal);

    try {
      const FULL_URL = `${GEMINI_API_URL}${userModel}:generateContent?key=${this.API_KEY}`;
      const response = await fetch(FULL_URL, requestOptions, signal);
      if (!response.ok) {
        await handleApiErrorResponse(response);
      }

      const data = await response.json();
      const content = data?.candidates[0]?.content?.parts[0]?.text;
      return content;
    } catch (err) {
      this._handleStreamResponseError(err);
    }
  }

  async sendRequestStreamResponse(messages, resClient, signal, options = {}) {
    try {
      const requestOptions = await this._prepareRequestOptions(messages, options, signal);
      const response = await this._fetchStreamResponse(requestOptions, options.userModel, signal);

      await this._processStreamResponse(response, resClient);
    } catch (err) {
      this._handleStreamResponseError(err);
    }
  }

  async _prepareRequestOptions(messages, options, signal) {
    const { maxTokens, temperature, isSupportsVision } = options;
    if (isSupportsVision) {
      await encodeFiles(messages);
    }
    const updatedMessages = await messageToGeminiFormat(messages, isSupportsVision);

    return this._prepareOptions({
      contents: updatedMessages.contents,
      systemInstruction: updatedMessages.systemInstruction,
      generation_config: {
        temperature: temperature || this.TEMPERATURE,
        maxOutputTokens: maxTokens || this.MAX_TOKENS,
      }
    }, signal);
  }

  async _fetchStreamResponse(requestOptions, userModel, signal) {
    const FULL_URL = `${GEMINI_API_URL}${userModel || this.MODEL}:streamGenerateContent?key=${this.API_KEY}`;
    const response = await fetch(FULL_URL, requestOptions, signal);
    if (!response.ok) {
      await handleApiErrorResponse(response);
    }

    return response;
  }

  async _processStreamResponse(response, resClient) {
    const textDecoder = new TextDecoder();
    let lastChunk = "";

    for await (const chunk of response.body) {
      let decodedChunk = textDecoder.decode(chunk, { stream: true });
      decodedChunk = lastChunk + decodedChunk;
      const lines = decodedChunk.split("\n");
      if (lines.length === 0 || !decodedChunk.endsWith("\n")) {
        lastChunk = decodedChunk;
      } else {
        for (const line of lines) {
          const text = this._extractTextFromLine(line);
          if (text) {
            resClient.write(text);
          }
        }
        lastChunk = "";
      }

    }
    resClient.end();
  }

  _extractTextFromLine(line) {
    if (line.includes('"text": ')) {
      const start = line.indexOf('"text": ') + 9; // 8 is length of '"text": ' including the space
      const end = line.lastIndexOf('"');
      let text = line.substring(start, end);
      text = text.replace(/\\n/g, '\n');
      return text;
    }
    return null;
  }

  _handleStreamResponseError(err) {
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


export default GeminiMessageAPI;


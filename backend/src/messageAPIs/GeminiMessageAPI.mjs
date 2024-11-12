import jsonata from "jsonata";

import { logger } from "../logger.mjs";
import MessageAPI from "./MessageAPI.mjs";
import { encodeFiles } from './FileEncoder.mjs';

const { GEMINI_API_KEY, GEMINI_API_URL } =
  process.env;

const SAFETY_SETTINGS = [
  { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_CIVIC_INTEGRITY", "threshold": "BLOCK_NONE" },
];

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
  logger.error("Gemini API response error: ", parsedText);

  // Throw an error with a message, checking if parsedText is an object and has an error.message  
  const errorMessage = `Gemini API Error: ${parsedText[0]?.error?.message || 'Unknown error occurred'}`;
  throw new Error(errorMessage);
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

const checkEnvVariables = () => {
  if (!GEMINI_API_URL || !GEMINI_API_KEY) {
    throw new Error("Gemini environment variables are not set correctly.");
  }
}

class GeminiMessageAPI extends MessageAPI {
  constructor() {
    super();
    checkEnvVariables();
    this.API_KEY = GEMINI_API_KEY;
    this.MODEL = 'models/gemini-1'; // Set a default model  
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
      "safetySettings": SAFETY_SETTINGS,
      generation_config: {
        temperature: temperature,
        maxOutputTokens: maxTokens,
      }
    }, signal);

    try {
      const FULL_URL = `${GEMINI_API_URL}${userModel || this.MODEL}:generateContent?key=${this.API_KEY}`;
      const response = await fetch(FULL_URL, requestOptions);
      if (!response.ok) {
        await handleApiErrorResponse(response);
      }

      const data = await response.json();
      const content = data?.candidates[0]?.content?.parts[0]?.text;
      return content;
    } catch (err) {
      logger.error("Error in sendRequest:", err);
      throw err; // Re-throw the error to be handled by the caller  
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
      "safetySettings": SAFETY_SETTINGS,
      generation_config: {
        temperature: temperature,
        maxOutputTokens: maxTokens,
      }
    }, signal);
  }

  async _fetchStreamResponse(requestOptions, userModel, signal) {
    const FULL_URL = `${GEMINI_API_URL}${userModel || this.MODEL}:streamGenerateContent?key=${this.API_KEY}`;
    console.log("requestOptions:", requestOptions);
    const response = await fetch(FULL_URL, requestOptions);
    if (!response.ok) {
      await handleApiErrorResponse(response);
    }

    return response;
  }

  async _processStreamResponse(response, resClient) {
    const textDecoder = new TextDecoder();
    let lastChunk = "";

    try {
      for await (const chunk of response.body) {
        let decodedChunk = textDecoder.decode(chunk, { stream: true });
        decodedChunk = lastChunk + decodedChunk;

        // Split decodedChunk into lines  
        const lines = decodedChunk.split("\n");

        // Handle incomplete lines  
        if (!decodedChunk.endsWith("\n")) {
          lastChunk = lines.pop();
        } else {
          lastChunk = "";
        }

        for (const line of lines) {
          const text = this._extractTextFromLine(line);
          if (text) {
            resClient.write(text);
          }
        }
      }

      // Process any remaining data in lastChunk  
      if (lastChunk) {
        const text = this._extractTextFromLine(lastChunk);
        if (text) {
          resClient.write(text);
        }
      }
    } catch (err) {
      this._handleStreamResponseError(err);
    } finally {
      resClient.end();
    }
  }

  _extractTextFromLine(line) {
    try {
      if (!line.trim()) return null;

      // Parse the JSON line if it's valid JSON    
      const data = JSON.parse(line);

      // Extract text from Gemini's response structure    
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        // Handle escaped characters properly    
        return JSON.parse(`"${text}"`); // This properly unescapes the string    
      }
    } catch (err) {
      // Fallback to regex method if JSON parsing fails    
      try {
        const regex = /"text"\s*:\s*"((?:\\.|[^"\\])*?)"/;
        const match = regex.exec(line);
        if (match && match[1]) {
          return JSON.parse(`"${match[1]}"`); // Properly unescapes the string    
        }
      } catch (regexErr) {
        logger.error("Failed to extract text from line:", regexErr);
      }
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
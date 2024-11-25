import jsonata from "jsonata";
import { logger } from "../logger.mjs";
import MessageAPI from "./MessageAPI.mjs";
import { encodeFiles } from './FileEncoder.mjs';

const { GEMINI_API_KEY, GEMINI_API_URL } = process.env;

if (!GEMINI_API_URL || !GEMINI_API_KEY) {
  throw new Error("Gemini environment variables are not set correctly.");
}

const SAFETY_SETTINGS = [
  { "category": "HARM_CATEGORY_HARASSMENT", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_HATE_SPEECH", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_DANGEROUS_CONTENT", "threshold": "BLOCK_NONE" },
  { "category": "HARM_CATEGORY_CIVIC_INTEGRITY", "threshold": "BLOCK_NONE" },
];

const messageTransform = jsonata(`  
  {  
    "contents": $map(*[role != 'context'], function($v) {  
      {  
        "role": $v.role = 'bot' ? 'model' : $v.role,  
        "parts": $v.files ? [  
          $map($v.files, function($file) {  
            { "inlineData": { "mimeType": $file.type, "data": $file.base64 } }  
          }),  
          { "text": $v.content }  
        ] : [{ "text": $v.content }]
      }  
    }),  
    "systemInstruction": $map(*[role = 'context'], function($v) {  
      {  
        "role": $v.role = 'bot' ? 'model' : $v.role,  
        "parts": $v.files ? [  
          $map($v.files, function($file) {  
            { "inlineData": { "mimeType": $file.type, "data": $file.base64 } }  
          }),  
          { "text": $v.content }  
        ] : [{ "text": $v.content }] 
      }  
    })  
  }  
`);

class GeminiMessageAPI extends MessageAPI {
  constructor() {
    super();
    this.API_KEY = GEMINI_API_KEY;
    this.MODEL = 'models/gemini-1';
  }


  async _prepareRequest(messages, options, signal) {
    const { maxTokens, temperature, isSupportsVision } = options;
    if (isSupportsVision) {
      await encodeFiles(messages);
    }

    const updatedMessages = await messageTransform.evaluate(messages);

    return {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: updatedMessages.contents,
        systemInstruction: updatedMessages.systemInstruction || [],
        safetySettings: SAFETY_SETTINGS,
        generation_config: { temperature, maxOutputTokens: maxTokens }
      }),
      signal
    };
  }


  async handleApiErrorResponse(response) {
    const text = await response.text();
    try {
      const parsedText = JSON.parse(text);
      const errorMessage = parsedText[0]?.error?.message ||
        parsedText.error?.message ||
        `HTTP ${response.status}: ${response.statusText}`;
      logger.error("Gemini API response error: ", parsedText);
      throw new Error(`Gemini API Error: ${errorMessage}`);
    } catch (error) {
      logger.error("Gemini API response error: ", text);
      throw new Error(`Gemini API Error: ${text || response.statusText}`);
    }
  }


  async sendRequest(messages, signal, options = {}) {
    try {
      const requestOptions = await this._prepareRequest(messages, options, signal);
      const url = new URL(`${GEMINI_API_URL}${options.userModel || this.MODEL}:generateContent`);
      url.searchParams.append('key', this.API_KEY);
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        await this.handleApiErrorResponse(response); // Use this.handleApiErrorResponse  
      }

      const data = await response.json();
      return data?.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (err) {
      logger.error("Error in sendRequest:", err);
      throw err;
    }
  }


  async sendRequestStreamResponse(messages, resClient, signal, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeout || 30000);

    try {
      const requestOptions = await this._prepareRequest(messages, options, signal || controller.signal);
      const url = new URL(`${GEMINI_API_URL}${options.userModel || this.MODEL}:streamGenerateContent`);
      url.searchParams.append('key', this.API_KEY);
      const response = await fetch(url, requestOptions);

      if (!response.ok) {
        await this.handleApiErrorResponse(response); // Use this.handleApiErrorResponse  
      }

      await this._processStreamResponse(response, resClient);
    } catch (err) {
      this._handleStreamResponseError(err);
    } finally {
      clearTimeout(timeout);
    }
  }

  async _processStreamResponse(response, resClient) {
    const textDecoder = new TextDecoder();
    let lastChunk = "";

    try {
      const reader = response.body.getReader();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        let decodedChunk = textDecoder.decode(value, { stream: true });
        decodedChunk = lastChunk + decodedChunk;

        const lines = decodedChunk.split("\n");

        if (!decodedChunk.endsWith("\n")) {
          lastChunk = lines.pop();
        } else {
          lastChunk = "";
        }

        for (const line of lines) {
          const text = this._extractTextFromLine(line);
          if (text) {
            await new Promise(resolve => resClient.write(text, resolve));
          }
        }
      }

      if (lastChunk) {
        const text = this._extractTextFromLine(lastChunk);
        if (text) {
          await new Promise(resolve => resClient.write(text, resolve));
        }
      }
    } catch (err) {
      this._handleStreamResponseError(err);
    } finally {
      resClient.end();
      if (!response.body.locked) {
        response.body.cancel();
      }
    }
  }

  _extractTextFromLine(line) {
    if (!line.trim()) return null;

    try {
      const data = JSON.parse(line);
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (text) {
        return this._unescapeString(text);
      }
    } catch (err) {
      try {
        const regex = /"text"\s*:\s*"((?:\\.|[^"\\])*?)"/;
        const match = regex.exec(line);
        if (match?.[1]) {
          return this._unescapeString(match[1]);
        }
      } catch (regexErr) {
        logger.error("Failed to extract text from line:", regexErr);
      }
    }
    return null;
  }

  _unescapeString(text) {
    try {
      return JSON.parse(`"${text}"`);
    } catch (err) {
      logger.error("Failed to unescape string:", err);
      return text;
    }
  }

  _handleStreamResponseError(err) {
    if (err.name === 'AbortError') {
      logger.error("Fetch aborted:", err);
    } else {
      logger.error("Error sending stream response:", err);
      throw err;
    }
  }
}

export default GeminiMessageAPI;  
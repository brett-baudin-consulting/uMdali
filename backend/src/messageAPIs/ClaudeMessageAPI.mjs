import fetch from "node-fetch";
import jsonata from "jsonata";

import MessageAPI from "./MessageAPI.mjs";
import { logger } from "../logger.mjs";
import { encodeFiles } from './FileEncoder.mjs';

const API_CONSTANTS = {
    ANTHROPIC_VERSION: '2023-06-01',
    CONTENT_TYPE: 'application/json',
    DEFAULT_MAX_TOKENS: 1000,
    DEFAULT_TEMPERATURE: 0.7,
    REQUEST_TIMEOUT: 30000
};

const transformWithVision = `  
$map($filter($, function($message) {  
    $message.role != 'context'  
}), function($message) {  
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
              {"type": "image",  
              "source":  
                {  
                    "type": "base64",  
                    "media_type": $file.type,  
                    "data": $file.base64  
                }  
              }  
          })  
      ]  
  }  
})[]  
`;

const transformWithoutVision = `  
$map($filter($, function($message) {  
    $message.role != 'context'  
}), function($message) {  
    {  
        "role": $message.role = 'bot' ? 'assistant' :  
                $message.role,   
        "content": $message.content  
    }  
})[]  
`;

async function messageToClaudeFormat(messages, isSupportsVision) {
    const transform = jsonata(isSupportsVision ? transformWithVision : transformWithoutVision);
    return await transform.evaluate(messages);
}

const { CLAUDE_API_KEY, CLAUDE_API_URL } = process.env;

function checkEnvVariables() {
    if (!CLAUDE_API_KEY || !CLAUDE_API_URL) {
        throw new Error("Claude environment variables are not set correctly.");
    }
}

async function handleApiErrorResponse(response) {
    const text = await response.text();
    const parsedText = text ? JSON.parse(text) : null;
    const errorMessage = `Claude API Error: ${parsedText?.error?.message ?? 'Unknown error occurred'}`;
    logger.error("Claude API response error: ", parsedText ?? text);
    throw new Error(errorMessage);
}

function validateRequestOptions(messages, options) {
    if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error('Messages must be a non-empty array');
    }

    const { temperature, maxTokens, userModel } = options;

    if (temperature !== undefined) {
        if (typeof temperature !== 'number' || temperature < 0 || temperature > 1) {
            throw new Error('Temperature must be a number between 0 and 1');
        }
    }

    if (maxTokens !== undefined) {
        if (!Number.isInteger(maxTokens) || maxTokens <= 0) {
            throw new Error('maxTokens must be a positive integer');
        }
    }

    if (userModel !== undefined && typeof userModel !== 'string') {
        throw new Error('userModel must be a string');
    }
}
class ClaudeMessageAPI extends MessageAPI {
    constructor() {
        super();
        checkEnvVariables();
        this.API_KEY = CLAUDE_API_KEY;
    }

    _prepareHeaders() {
        return {
            "x-api-key": this.API_KEY,
            "anthropic-version": API_CONSTANTS.ANTHROPIC_VERSION,
            "Content-Type": API_CONSTANTS.CONTENT_TYPE,
        };
    }

    _prepareOptions(body, signal) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONSTANTS.REQUEST_TIMEOUT);

        const cleanup = () => clearTimeout(timeoutId);
        signal?.addEventListener('abort', cleanup);

        return {
            method: "POST",
            headers: this._prepareHeaders(),
            body: JSON.stringify(body),
            signal: signal || controller.signal,
            timeout: API_CONSTANTS.REQUEST_TIMEOUT,
            cleanup
        };
    }

    async sendRequest(messages, signal, options = {}) {
        validateRequestOptions(messages, options);
        let cleanup;

        const {
            userModel,
            maxTokens = API_CONSTANTS.DEFAULT_MAX_TOKENS,
            temperature = API_CONSTANTS.DEFAULT_TEMPERATURE,
            isSupportsVision
        } = options;

        try {
            if (isSupportsVision) {
                await encodeFiles(messages);
            }

            const updatedMessages = await messageToClaudeFormat(messages, isSupportsVision);
            const systemMessage = messages.find(m => m.role === 'context');

            const requestOptions = this._prepareOptions({
                system: systemMessage?.content,
                model: userModel,
                messages: updatedMessages,
                max_tokens: maxTokens,
                temperature: temperature,
            }, signal);

            cleanup = requestOptions.cleanup;
            delete requestOptions.cleanup;

            const response = await fetch(CLAUDE_API_URL, requestOptions);

            if (!response.ok) {
                await handleApiErrorResponse(response);
            }

            const data = await response.json();
            return data?.content[0]?.text;

        } catch (err) {
            if (err.name === 'AbortError') {
                logger.error("Request aborted:", err);
                throw new Error('Request was aborted');
            }
            throw err;
        } finally {
            cleanup?.();
        }
    }

    async sendRequestStreamResponse(messages, resClient, signal, options = {}) {
        validateRequestOptions(messages, options);
        let cleanup;

        const {
            userModel,
            maxTokens = API_CONSTANTS.DEFAULT_MAX_TOKENS,
            temperature = API_CONSTANTS.DEFAULT_TEMPERATURE,
            isSupportsVision
        } = options;

        try {
            if (isSupportsVision) {
                await encodeFiles(messages);
            }

            const updatedMessages = await messageToClaudeFormat(messages, isSupportsVision);
            const systemMessage = messages.find(m => m.role === 'context');

            const requestOptions = this._prepareOptions({
                system: systemMessage?.content,
                model: userModel,
                messages: updatedMessages,
                max_tokens: maxTokens,
                temperature: temperature,
                stream: true,
            }, signal);

            cleanup = requestOptions.cleanup;
            delete requestOptions.cleanup;

            const response = await fetch(CLAUDE_API_URL, requestOptions);

            if (!response.ok) {
                await handleApiErrorResponse(response);
            }

            await this.processResponseStream(response, resClient);
        } catch (err) {
            handleStreamError(err);
        } finally {
            cleanup?.();
        }
    }

    async processResponseStream(response, resClient) {
        try {
            // Use for-await loop for ReadableStream  
            for await (const chunk of response.body) {
                const decodedChunk = new TextDecoder().decode(chunk);
                const lines = decodedChunk.split('\n');

                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        await this.handleStreamedContent([line], resClient);
                    }
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                logger.info('Stream processing aborted');
            } else {
                logger.error('Stream processing error:', error);
                throw error;
            }
        } finally {
            resClient.end();
        }
    }

    async handleStreamedContent(lines, resClient) {
        for (const line of lines) {
            if (!line.startsWith("data: ")) continue;

            const content = line.replace(/^data: /, "").trim();
            if (!content) continue;

            try {
                const event = JSON.parse(content);
                switch (event.type) {
                    case 'content_block_delta':
                        if (event.delta?.text) {
                            resClient.write(event.delta.text);
                        }
                        break;
                    case 'message_stop':
                        break;
                    default:
                        logger.debug(`Unknown event type: ${event.type}`);
                }
            } catch (error) {
                logger.error('Error parsing streamed content:', error, { content });
            }
        }
    }
}

function handleStreamError(err) {
    if (err.name === 'AbortError') {
        logger.error("Stream aborted:", err);
        throw new Error('Stream was aborted');
    }
    logger.error("Error in stream response:", err);
    throw err;
}

export default ClaudeMessageAPI;  
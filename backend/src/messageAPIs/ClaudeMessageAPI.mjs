import fetch from "node-fetch";
import jsonata from "jsonata";

import MessageAPI from "./MessageAPI.mjs";
import { logger } from "../logger.mjs";
import { encodeFiles } from './FileEncoder.mjs';

// JSONata expression

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
    if (!isSupportsVision) {
        const transform = jsonata(transformWithoutVision);
        const claude = await transform.evaluate(messages);
        return claude;
    }
    const transform = jsonata(transformWithVision);
    const claude = await transform.evaluate(messages);
    return claude;
}

const { CLAUDE_MODEL, CLAUDE_API_KEY, CLAUDE_MAX_TOKENS, CLAUDE_TEMPERATURE, CLAUDE_API_URL } =
    process.env;

const checkEnvVariables = () => {
    if (!CLAUDE_MODEL || !CLAUDE_API_KEY || !CLAUDE_MAX_TOKENS || !CLAUDE_TEMPERATURE) {
        throw new Error("Environment variables are not set correctly.");
    }

    const temperature = parseFloat(CLAUDE_TEMPERATURE);
    const maxTokens = parseInt(CLAUDE_MAX_TOKENS, 10);
    if (Number.isNaN(maxTokens) || Number.isNaN(temperature)) {
        throw new Error("Invalid CLAUDE_MAX_TOKENS or CLAUDE_TEMPERATURE environment variable value.");
    }

    return { temperature, maxTokens };
};

const envValues = checkEnvVariables();

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
    logger.error("Claude API response error: ", parsedText);

    // Throw an error with a message, checking if parsedText is an object and has an error.message
    const errorMessage = `Claude API Error: ${parsedText?.error?.message || 'Unknown error occurred'}`;
    throw new Error(errorMessage);
}

class ClaudeMessageAPI extends MessageAPI {
    constructor(userModel) {
        super();
        this.MODEL = userModel || CLAUDE_MODEL;
        this.API_KEY = CLAUDE_API_KEY;
        this.TEMPERATURE = envValues.temperature;
        this.MAX_TOKENS = envValues.maxTokens;
    }

    _prepareHeaders() {
        return {
            "x-api-key": this.API_KEY,
            "anthropic-version": "2023-06-01",
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
        const updatedMessages = await messageToClaudeFormat(messages, isSupportsVision);
        let systemMessage = messages.find(m => m.role === 'context');
        const requestOptions = this._prepareOptions({
            system: systemMessage?.content,
            model: userModel || this.MODEL,
            messages: updatedMessages,
            max_tokens: maxTokens || this.MAX_TOKENS,
            temperature: temperature || this.TEMPERATURE,
        }, signal);

        try {
            const response = await fetch(CLAUDE_API_URL, requestOptions, signal);

            if (!response.ok) {
                await handleApiErrorResponse(response);
            }

            const data = await response.json();
            const content = data?.content[0]?.text;
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
        const updatedMessages = await messageToClaudeFormat(messages, isSupportsVision);
        let systemMessage = messages.find(m => m.role === 'context');
        const requestOptions = this._prepareOptions({
            system: systemMessage?.content,
            model: userModel || this.MODEL,
            messages: updatedMessages,
            max_tokens: maxTokens || this.MAX_TOKENS,
            temperature: temperature || this.TEMPERATURE,
            stream: true,
        }, signal);
        try {
            const response = await fetch(CLAUDE_API_URL, requestOptions, signal);
            if (!response.ok) {
                await handleApiErrorResponse(response);
            }
            await this.processResponseStream(response, resClient);
        } catch (err) {
            handleStreamError(err);
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
        resClient.end();
    }
    async handleStreamedContent(lines, resClient, lastChunk) {
        for (const line of lines) {
            if (line.startsWith("data: ")) {
                const content = line.replace(/^data: /, "").trim();
                try {
                    const event = JSON.parse(content);

                    switch (event.type) {
                        case 'content_block_delta':
                            resClient.write(event.delta.text);
                            break;
                        case 'message_stop':
                            break;
                        default:
                    }
                } catch (error) {
                    lastChunk = line; // Keep the partial line for the next iteration
                }
            }
        }
        return lastChunk; // Return the lastChunk for the next iteration
    }
}

function handleStreamError(err) {
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

export default ClaudeMessageAPI;

import { Anthropic } from '@anthropic-ai/sdk';
import MessageAPI from "./MessageAPI.mjs";
import { logger } from "../logger.mjs";
import { encodeFiles } from './FileEncoder.mjs';

const API_CONSTANTS = {
    DEFAULT_MAX_TOKENS: 1000,
    DEFAULT_TEMPERATURE: 0.7,
    REQUEST_TIMEOUT: 30000,
    STREAM_TIMEOUT: 60000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
};

class ClaudeMessageAPI extends MessageAPI {
    constructor() {
        super();
        if (!process.env.CLAUDE_API_KEY) {
            throw new Error("Claude API key is not set");
        }
        this.client = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY,
            timeout: API_CONSTANTS.STREAM_TIMEOUT
        });
    }

    async formatMessages(messages, isSupportsVision) {
        const systemMessage = messages.find(m => m.role === 'context');
        const formattedMessages = messages
            .filter(m => m.role !== 'context')
            .map(message => ({
                role: message.role === 'bot' ? 'assistant' : message.role,
                content: isSupportsVision && message.files ?
                    [
                        { type: 'text', text: message.content },
                        ...message.files.map(file => ({
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: file.type,
                                data: file.base64
                            }
                        }))
                    ] :
                    message.content
            }));

        return { systemMessage, formattedMessages };
    }

    async sendRequest(messages, signal, options = {}) {
        const {
            userModel = 'claude-3-opus-20240229',
            maxTokens = API_CONSTANTS.DEFAULT_MAX_TOKENS,
            temperature = API_CONSTANTS.DEFAULT_TEMPERATURE,
            isSupportsVision = false
        } = options;

        let attempts = 0;

        while (attempts < API_CONSTANTS.MAX_RETRIES) {
            try {
                if (isSupportsVision) {
                    await encodeFiles(messages);
                }

                const { systemMessage, formattedMessages } = await this.formatMessages(messages, isSupportsVision);

                const response = await this.client.messages.create({
                    model: userModel,
                    max_tokens: maxTokens,
                    temperature: temperature,
                    system: systemMessage?.content,
                    messages: formattedMessages,
                }, { signal });

                return response.content[0].text;

            } catch (error) {
                attempts++;

                if (error?.error?.type === 'overloaded_error') {
                    if (attempts < API_CONSTANTS.MAX_RETRIES) {
                        logger.warn(`Claude API overloaded, retrying in ${API_CONSTANTS.RETRY_DELAY}ms...`);
                        await new Promise(resolve => setTimeout(resolve, API_CONSTANTS.RETRY_DELAY));
                        continue;
                    }
                }

                logger.error("Claude API error:", error);
                throw error;
            }
        }
    }

    async sendRequestStreamResponse(messages, resClient, signal, options = {}) {
        const {
            userModel = 'claude-3-opus-20240229',
            maxTokens = API_CONSTANTS.DEFAULT_MAX_TOKENS,
            temperature = API_CONSTANTS.DEFAULT_TEMPERATURE,
            isSupportsVision = false
        } = options;

        let attempts = 0;
        let stream;

        while (attempts < API_CONSTANTS.MAX_RETRIES) {
            try {
                if (isSupportsVision) {
                    await encodeFiles(messages);
                }

                const { systemMessage, formattedMessages } = await this.formatMessages(messages, isSupportsVision);

                stream = await this.client.messages.create({
                    model: userModel,
                    max_tokens: maxTokens,
                    temperature: temperature,
                    system: systemMessage?.content,
                    messages: formattedMessages,
                    stream: true,
                }, { signal });

                if (signal) {
                    signal.addEventListener('abort', () => {
                        if (stream?.controller) {
                            stream.controller.abort();
                        }
                        resClient.end();
                    });
                }

                for await (const chunk of stream) {
                    try {
                        if (chunk.type === 'content_block_delta' && chunk.delta.text) {
                            if (!resClient.write(chunk.delta.text)) {
                                // Handle backpressure  
                                await new Promise(resolve => resClient.once('drain', resolve));
                            }
                        }
                    } catch (error) {
                        logger.error("Error processing stream chunk:", error);
                        throw error;
                    }
                }

                return; // Success

            } catch (error) {
                attempts++;

                if (error?.error?.type === 'overloaded_error') {
                    if (attempts < API_CONSTANTS.MAX_RETRIES) {
                        logger.warn(`Claude API overloaded, retrying in ${API_CONSTANTS.RETRY_DELAY}ms...`);
                        await new Promise(resolve => setTimeout(resolve, API_CONSTANTS.RETRY_DELAY));
                        continue;
                    }
                }

                logger.error("Stream error:", error);
                try {
                    resClient.write(JSON.stringify({
                        error: 'An error occurred while processing your request'
                    }));
                } catch (writeError) {
                    logger.error("Error writing error response:", writeError);
                }
                throw error;
            } finally {
                try {
                    resClient.end();
                } catch (endError) {
                    logger.error("Error ending response stream:", endError);
                }
            }
        }
    }
}

export default ClaudeMessageAPI;  
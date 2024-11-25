import { Anthropic } from '@anthropic-ai/sdk';
import MessageAPI from "./MessageAPI.mjs";
import { logger } from "../logger.mjs";
import { encodeFiles } from './FileEncoder.mjs';

const API_CONSTANTS = {
    DEFAULT_MAX_TOKENS: 1000,
    DEFAULT_TEMPERATURE: 0.7,
    REQUEST_TIMEOUT: 30000
};

class ClaudeMessageAPI extends MessageAPI {
    constructor() {
        super();
        if (!process.env.CLAUDE_API_KEY) {
            throw new Error("Claude API key is not set");
        }
        this.client = new Anthropic({
            apiKey: process.env.CLAUDE_API_KEY,
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
            logger.error("Claude API error:", error);
            throw error;
        }
    }

    async sendRequestStreamResponse(messages, resClient, signal, options = {}) {
        const {
            userModel = 'claude-3-opus-20240229',
            maxTokens = API_CONSTANTS.DEFAULT_MAX_TOKENS,
            temperature = API_CONSTANTS.DEFAULT_TEMPERATURE,
            isSupportsVision = false
        } = options;

        try {
            if (isSupportsVision) {
                await encodeFiles(messages);
            }

            const { systemMessage, formattedMessages } = await this.formatMessages(messages, isSupportsVision);

            const stream = await this.client.messages.create({
                model: userModel,
                max_tokens: maxTokens,
                temperature: temperature,
                system: systemMessage?.content,
                messages: formattedMessages,
                stream: true,
            }, { signal });

            for await (const chunk of stream) {
                if (chunk.type === 'content_block_delta' && chunk.delta.text) {
                    resClient.write(chunk.delta.text);
                }
            }
        } catch (error) {
            logger.error("Stream error:", error);
            throw error;
        } finally {
            resClient.end();
        }
    }
}

export default ClaudeMessageAPI;  
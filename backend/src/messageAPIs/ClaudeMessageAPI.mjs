import fetch from 'node-fetch';
import MessageAPI from './MessageAPI.mjs'

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/complete';

// ************************************************************
// *                                                          *
// *  Never tested due to lack of access to claude API        *
// *                                                          *
// ************************************************************

class ClaudeMessageAPI extends MessageAPI {
    constructor() {
        super();

        const {
            CLAUDE_MODEL,
            ANTHROPIC_API_KEY,
            CLAUDE_MAX_TOKENS,
            CLAUDE_TEMPERATURE
        } = process.env;

        if (!CLAUDE_MODEL || !ANTHROPIC_API_KEY || !CLAUDE_MAX_TOKENS || !CLAUDE_TEMPERATURE) {
            throw new Error("Environment variables are not set correctly.");
        }

        this.MODEL = CLAUDE_MODEL;
        this.API_KEY = ANTHROPIC_API_KEY;
        this.TEMPERATURE = CLAUDE_TEMPERATURE;
        const maxTokens = CLAUDE_MAX_TOKENS;
        this.MAX_TOKENS = Number(maxTokens);

        if (isNaN(this.MAX_TOKENS)) {
            throw new Error('Invalid max token value');
        }
    }

    formatUserMessage(messages) {
        if (!messages || messages.length === 0) {
            throw new Error("No messages provided.");
        }

        const userMessage = messages[messages.length - 1];
        return `\n\nHuman: ${userMessage.content}\n\nAssistant:`;
    }

    async sendPromptMessage(prompt, opt) {
        if (typeof prompt !== 'string') {
            throw new Error("Prompt must be a string.");
        }

        const options = {
            method: "POST",
            headers: {
                "X-API-KEY": this.API_KEY,
                "Content-Type": "application/json",
                "Anthropic-Version": "2023-06-01",
            },
            body: JSON.stringify({
                model: opt.model || this.MODEL,
                prompt,
                max_tokens_to_sample: opt.maxTokens || this.MAX_TOKENS
            }),
        };

        const response = await fetch(CLAUDE_API_URL, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error.message);
        }

        return data;
    }

    async sendRequest(messages, options = {}) {
        try {
            const prompt = this.formatUserMessage(messages);
            const data = await this.sendPromptMessage(prompt, options);

            return {
                choices: [
                    {
                        message: {
                            content: data.completion,
                            role: 'assistant',
                        },
                    },
                ],
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            }
        }
    }
}

export default ClaudeMessageAPI;
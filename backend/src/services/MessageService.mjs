import { logger } from "../logger.mjs";

class MessageServiceError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.name = 'MessageServiceError';
        this.statusCode = statusCode;
    }
}

export class MessageService {
    constructor(messageAPIs) {
        this.messageAPIs = messageAPIs;
    }

    async getFilters() {
        const filterNames = (process.env.FILTERS || "").split(",").filter(Boolean);
        const filters = [];

        for (const name of filterNames) {
            try {
                const filterModule = await import(`../filters/${name}.mjs`);
                const FilterClass = filterModule.default;
                filters.push(new FilterClass());
            } catch (err) {
                logger.warn(`Unable to load filter: ${name} - ${err.message}`);
            }
        }

        return filters;
    }

    async filterMessages(messages) {
        if (!Array.isArray(messages)) {
            throw new MessageServiceError('Messages must be an array', 400);
        }

        const filters = await this.getFilters();
        return Promise.all(messages.map(async (message, index) => {
            if (!message?.content) {
                throw new MessageServiceError(`Invalid message at index ${index}`, 400);
            }

            const processed = { ...message };
            for (const filter of filters) {
                try {
                    processed.content = await filter.process(processed.content);
                } catch (err) {
                    logger.error(`Filter error for message ${index}:`, err);
                    throw new MessageServiceError('Message filtering failed', 500);
                }
            }
            return processed;
        }));
    }

    getAPI(model) {
        const SUPPORTED_MODELS = ["ollama", "google", "openai", "mistral", "anthropic", "groq", "reka"];
        const modelImplementation = SUPPORTED_MODELS.find(m => model?.vendor?.toLowerCase() === m);
        if (!modelImplementation) {
            throw new MessageServiceError(`Unsupported model vendor: ${model?.vendor}`, 400);
        }
        const api = this.messageAPIs[modelImplementation];
        if (!api) {
            throw new MessageServiceError(`API implementation not found for ${modelImplementation}`, 500);
        }
        return api;
    }

    async sendMessage(messageAPI, messages, options, signal) {
        try {
            return await messageAPI.sendRequest(messages, signal, options);
        } catch (error) {
            if (error.name === 'AbortError') {
                logger.info('Request was aborted');
                return;
            }
            throw error;
        }
    }

    async streamMessage(messageAPI, messages, options, res, signal) {
        const cleanup = () => {
            if (!res.writableEnded) {
                res.end();
            }
        };

        try {
            res.on('close', cleanup);
            res.on('error', cleanup);

            await messageAPI.sendRequestStreamResponse(messages, res, signal, options);
        } catch (error) {
            if (error.name === 'AbortError') {
                logger.info('Stream request was aborted');
                return;
            }
            throw error;
        } finally {
            res.removeListener('close', cleanup);
            res.removeListener('error', cleanup);
        }
    }

    prepareMessages(messages, model) {
        return messages
            .filter(msg => msg.role !== 'tool')
            .filter(msg => model.isSupportsContext || msg.role !== 'context');
    }
}  
export default MessageService;
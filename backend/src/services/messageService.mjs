import { logger } from "../logger.mjs";

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
            throw new Error('Messages must be an array');
        }

        const filters = await this.getFilters();
        return Promise.all(messages.map(async message => {
            const processed = { ...message };
            for (const filter of filters) {
                processed.content = await filter.process(processed.content);
            }
            return processed;
        }));
    }

    getAPI(model) {
        const SUPPORTED_MODELS = ["ollama", "google", "openai", "mistral", "anthropic", "groq", "reka"];
        const modelImplementation = SUPPORTED_MODELS.find(m => model?.vendor?.toLowerCase() === m);
        return this.messageAPIs[modelImplementation];
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
        try {
            res.on('close', () => {
                if (!res.writableEnded) {
                    signal.abort();
                }
            });

            return await messageAPI.sendRequestStreamResponse(messages, res, signal, options);
        } catch (error) {
            if (error.name === 'AbortError') {
                logger.info('Stream request was aborted');
                return;
            }
            throw error;
        }
    }

    prepareMessages(messages, model) {
        return messages
            .filter(msg => msg.role !== 'tool')
            .filter(msg => model.isSupportsContext || msg.role !== 'context');
    }
}  
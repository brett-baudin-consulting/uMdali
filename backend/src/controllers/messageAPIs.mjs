import OpenAIMessageAPI from "../messageAPIs/OpenAIMessageAPI.mjs";
import ClaudeMessageAPI from "../messageAPIs/ClaudeMessageAPI.mjs";
import GeminiMessageAPI from "../messageAPIs/GeminiMessageAPI.mjs";
import MistralMessageAPI from "../messageAPIs/MistralAIMessageAPI.mjs";
import GroqMessageAPI from "../messageAPIs/GroqMessageAPI.mjs";
import OllamaOpenAIMessageAPI from "../messageAPIs/OllamaOpenAIMessageAPI.mjs";
import RekaMessageAPI from "../messageAPIs/RekaMessageAPI.mjs";

export const messageAPIs = {
    ollama: new OllamaOpenAIMessageAPI(),
    anthropic: new ClaudeMessageAPI(),
    openai: new OpenAIMessageAPI(),
    google: new GeminiMessageAPI(),
    mistral: new MistralMessageAPI(),
    groq: new GroqMessageAPI(),
    reka: new RekaMessageAPI(),
};

export function isValidMessageAPI(api) {
    return api &&
        typeof api.sendRequest === 'function' &&
        typeof api.sendRequestStreamResponse === 'function';
}

export function getAvailableVendors() {
    return Object.keys(messageAPIs);
}

export function isVendorSupported(vendor) {
    return vendor && vendor.toLowerCase() in messageAPIs;
}  
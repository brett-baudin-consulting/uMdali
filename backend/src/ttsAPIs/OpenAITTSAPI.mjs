import fetch from "node-fetch";
import TTSAPI from "./TTSAPI.mjs";
import { logger } from "../logger.mjs";

class OpenAITTSAPI extends TTSAPI {
    async sendRequest(textToSpeechModel, text, voice_id, signal) {
        const { OPENAI_TTS_API_URL, OPENAI_TTS_API_KEY } = process.env;

        if (!OPENAI_TTS_API_URL || !OPENAI_TTS_API_KEY) {
            logger.error('OPENAI_TTS_API_URL or OPENAI_TTS_API_KEY is not defined in environment variables.');
            throw new Error('Required environment variables are not set.');
        }

        const body = {
            input: text,
            model: textToSpeechModel,
            voice: voice_id,
        };
        const headers = {
            Authorization: `Bearer ${OPENAI_TTS_API_KEY}`,
            "Content-Type": "application/json",
        };

        try {
            const response = await fetch(OPENAI_TTS_API_URL, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                signal: signal
            });

            if (!response.ok) {
                const error = await response.text();
                logger.error(`OpenAI API error: ${error}, Status Code: ${response.status}`);
                throw new Error(`OpenAI API error: ${error}, Status Code: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            const audio = Buffer.from(arrayBuffer);
            return audio;
        } catch (error) {
            logger.error(`Error sending request to OpenAI API: ${error.message}`);
            throw error;
        }
    }
}

export default OpenAITTSAPI;
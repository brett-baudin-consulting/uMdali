import fetch from "node-fetch";
import TTSAPI from "./TTSAPI.mjs";
import { logger } from "../logger.mjs";

const VOICEID = '2EiwWnXFnvU5JabPnv8n';
class OpenAITTSAPI extends TTSAPI {
    async sendRequest(textToSpeechModel, text, signal, voice_id) {
        console.log('OpenAIAPI sendRequest');
        const { OPENAI_TTS_API_URL, OPENAI_TTS_API_KEY } = process.env;
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
            console.log('OPENAI_TTS_API_URL:', `${OPENAI_TTS_API_URL}`);
            console.log('body:', body);
            const response = await fetch(`${OPENAI_TTS_API_URL}`, {
                method: "POST",
                headers,
                body: JSON.stringify(body)
            }, { signal });

            if (!response.ok) {
                const error = await response.text();
                console.log('OpenAI API sendRequest error:', error);
                logger.error(`OpenAI API error: ${error}, Status Code: ${response.status}`);
                throw new Error(`OpenAI API error: ${error}, Status Code: ${response.status}`);
            }

            // Using response.arrayBuffer() and converting it to a Buffer
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
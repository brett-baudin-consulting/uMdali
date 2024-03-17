import fetch from "node-fetch";
import TTSAPI from "./TTSAPI.mjs";
import { logger } from "../logger.mjs";

class ElevenLabsAPI extends TTSAPI {
    async sendRequest(textToSpeechModel, text, voice_id, signal) {
        const { ELEVENLABS_API_URL, ELEVENLABS_API_KEY } = process.env;

        // Validate environment variables
        if (!ELEVENLABS_API_URL || !ELEVENLABS_API_KEY) {
            logger.error("Missing required environment variables: ELEVENLABS_API_URL or ELEVENLABS_API_KEY");
            throw new Error("Missing required environment variables: ELEVENLABS_API_URL or ELEVENLABS_API_KEY");
        }

        const body = {
            text,
            model_id: textToSpeechModel
        };
        const headers = {
            "Content-Type": "application/json",
            "xi-api-key": ELEVENLABS_API_KEY
        };

        try {
            const response = await fetch(`${ELEVENLABS_API_URL}/${voice_id}`, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
                signal
            });

            if (!response.ok) {
                const error = await response.text();
                logger.error(`ElevenLabs API error: ${error}, Status Code: ${response.status}`);
                throw new Error(`ElevenLabs API error: ${error}, Status Code: ${response.status}`);
            }

            const arrayBuffer = await response.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (error) {
            logger.error(`Error sending request to ElevenLabs API: ${error.message}`);
            throw error;
        }
    }
}

export default ElevenLabsAPI;
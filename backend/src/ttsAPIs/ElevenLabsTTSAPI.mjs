import fetch from "node-fetch";
import TTSAPI from "./TTSAPI.mjs";
import { logger } from "../logger.mjs";

const VOICEID = '2EiwWnXFnvU5JabPnv8n';
class ElevenLabsAPI extends TTSAPI {
    async sendRequest(textToSpeechModel, text, signal) {
        console.log('ElevenLabsAPI sendRequest');
        const { ELEVENLABS_API_URL, ELEVENLABS_API_KEY } = process.env;
        const body = {
            text,
            model_id: textToSpeechModel
        };
        const headers = {
            "Content-Type": "application/json",
            "xi-api-key": `${ELEVENLABS_API_KEY}`
        };

        try {
            console.log('ELEVENLABS_API_URL:', `${ELEVENLABS_API_URL}/${VOICEID}`);
            console.log('body:', body);
            const response = await fetch(`${ELEVENLABS_API_URL}/${VOICEID}`, {
                method: "POST",
                headers,
                body: JSON.stringify(body)
            }, { signal });

            if (!response.ok) {
                const error = await response.text();
                console.log('ElevenLabsAPI sendRequest error:', error);
                logger.error(`ElevenLabs API error: ${error}, Status Code: ${response.status}`);
                throw new Error(`ElevenLabs API error: ${error}, Status Code: ${response.status}`);
            }

            // Using response.arrayBuffer() and converting it to a Buffer
            const arrayBuffer = await response.arrayBuffer();
            const audio = Buffer.from(arrayBuffer);
            return audio;
        } catch (error) {
            logger.error(`Error sending request to ElevenLabs API: ${error.message}`);
            throw error;
        }
    }
}

export default ElevenLabsAPI;
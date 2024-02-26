import TranscriptionService from './TranscriptionService.js';
import fetch from 'node-fetch';

class ExampleSTTService extends TranscriptionService {
    async transcribe(audioData) {
        try {
            const response = await fetch('https://example-stt-service.com/transcribe', {
                method: 'POST',
                body: audioData,
                headers: { 'Content-Type': 'audio/mp3' },
            });
            if (!response.ok) {
                throw new Error(`STT Service responded with status ${response.status}`);
            }
            const transcription = await response.json();
            return transcription.text;
        } catch (error) {
            throw new Error(`Error transcribing audio: ${error.message}`);
        }
    }
}

export default ExampleSTTService;
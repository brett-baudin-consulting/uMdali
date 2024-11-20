// Removed the import for 'form-data'
import { env } from 'process';
import fetch from 'node-fetch'; // Ensure AbortController is imported

import { logger } from '../logger.mjs';
import TranscriptionService from './TranscriptionService.mjs';

class OpenAITranscriptionService extends TranscriptionService {
  constructor() {
    super();
    this.checkEnvVars();
    this.apiKey = env.OPENAI_TRANSCRIPTION_API_KEY;
    this.transcriptionEndpoint = env.OPENAI_TRANSCRIPTION_ENDPOINT;
  }

  checkEnvVars() {
    const requiredEnvVars = [
      'OPENAI_TRANSCRIPTION_API_KEY',
      'OPENAI_TRANSCRIPTION_ENDPOINT',
      'OPENAI_TRANSCRIPTION_TIMEOUT_MS'];
    const missingEnvVars = requiredEnvVars.filter(envVar => !env[envVar]);
    if (missingEnvVars.length > 0) {
      throw new Error(`Required environment variables for OpenAI are not set: ${missingEnvVars.join(', ')}`);
    }
  }

  async transcribe(audioBuffer, options = {}) {
    try {
      const formData = new FormData();
      const blob = new Blob([audioBuffer], { type: 'audio/webm' });
      formData.append('model', 'whisper-1');
      formData.append('file', blob, 'audio.webm'); // Adjusted for native FormData usage

      if (options.language) {
        formData.append('language', options.language);
      }
      formData.append('response_format', options.responseFormat || 'json');

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), parseInt(env.OPENAI_TRANSCRIPTION_TIMEOUT_MS, 10));

      const response = await fetch(this.transcriptionEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          // Removed manual Content-Type header, as it's now unnecessary
        },
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`API responded with status ${response.status}: ${errorBody}`);
      }

      logger.info(`Successful transcription request.`);
      const jsonResp = await response.json();
      return jsonResp;
    } catch (error) {
      logger.error('Error transcribing audio:', error);
      throw new Error(`Transcription service failed: ${error.message}`);
    }
  }
}

export default OpenAITranscriptionService;
import WebSocket from 'ws';


import { logger } from '../logger.mjs';

async function parseAndProcessMessage(ws, messageData) {
    let parsedData;
    try {
        parsedData = JSON.parse(messageData);
    } catch (err) {
        logger.error('JSON parsing failed.', err);
        throw new Error('Invalid JSON format');
    }
    const { options, audioData } = parsedData;

    if (!options || !audioData) {
        throw new Error('Options or audioData missing');
    }

    const { serviceId } = options;
    const transcriptionService = await importService(serviceId);

    const audioBuffer = Buffer.from(audioData, 'base64');

    const transcription = await transcriptionService.transcribe( audioBuffer,options);
    if (!transcription) {
        throw new Error('Failed to transcribe audio');
    }

    return transcription;
}

export default function setupWebSocket(wss) {
    wss.on('connection', ws => {

        ws.on('message', async messageData => {
            try {
                const transcription = await parseAndProcessMessage(ws, messageData);
                safeSend(ws, transcription);
            } catch (error) {
                logger.error(`Error processing message: ${error.message}`);
                handleErrorMessage(ws, error);
            }
        });

        ws.on('error', error => {
            logger.error('WebSocket error:', error);
        });

        ws.on('close', () => {
            logger.info('WebSocket connection closed');
        });
    });
}

function handleErrorMessage(ws, error) {
    const clientErrorMessages = [
        "not available",
        "Invalid message format",
    ];
    const isClientError = clientErrorMessages.some(msg => error.message.includes(msg));
    const errorMessage = {
        error: 'Failed to transcribe audio',
        details: error.message,
        type: isClientError ? 'ClientError' : 'ServerError'
    };
    safeSend(ws, JSON.stringify(errorMessage));
}

async function importService(serviceId) {
    const services = {
        'ExampleSTTService': './exampleSTTService.mjs',
        'AnotherSTTService': './anotherSTTService.mjs',
        'OpenAITranscriptionService': './OpenAITranscriptionService.mjs'
    };

    if (!services.hasOwnProperty(serviceId)) {
        throw new Error("Requested transcription service is not available");
    }

    try {
        const module = await import(services[serviceId]);
        return new module.default();
    } catch (err) {
        logger.error(`Failed to import service: ${serviceId}`, err);
        throw new Error('Transcription service loading failed');
    }
}

function safeSend(ws, message) {
   const msgToSend = typeof message === 'object' ? JSON.stringify(message) : message;
    if (ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(msgToSend);
        } catch (error) {
            logger.error('Error sending message', error);
        }
    }
}
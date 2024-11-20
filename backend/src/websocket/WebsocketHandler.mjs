import WebSocket from 'ws';
import { logger } from '../logger.mjs';

const HEARTBEAT_INTERVAL = 30000;
const CLIENT_TIMEOUT = 35000;

const SERVICES_MAP = new Map([
    ['ExampleSTTService', './exampleSTTService.mjs'],
    ['AnotherSTTService', './anotherSTTService.mjs'],
    ['OpenAITranscriptionService', './OpenAITranscriptionService.mjs']
]);

export default function setupWebSocket(wss) {
    wss.on('connection', (ws) => {
        ws.isAlive = true;
        ws.on('pong', () => {
            ws.isAlive = true;
        });

        setupConnectionHandlers(ws);
    });

    const interval = setInterval(() => {
        wss.clients.forEach(ws => {
            if (ws.isAlive === false) {
                return ws.terminate();
            }
            ws.isAlive = false;
            ws.ping();
        });
    }, HEARTBEAT_INTERVAL);

    wss.on('close', () => {
        clearInterval(interval);
    });
}

function setupConnectionHandlers(ws) {
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
        ws.isAlive = false;
        logger.info('WebSocket connection closed');
    });
}

async function parseAndProcessMessage(ws, messageData) {
    let parsedData;
    try {
        parsedData = messageData instanceof Buffer
            ? JSON.parse(messageData.toString())
            : JSON.parse(messageData);
    } catch (err) {
        logger.error('JSON parsing failed.', err);
        throw new Error('Invalid JSON format');
    }

    const { options, audioData } = parsedData;

    if (!options?.serviceId || !audioData) {
        throw new Error('Invalid message format: missing required fields');
    }

    const transcriptionService = await importService(options.serviceId);
    const audioBuffer = Buffer.from(audioData, 'base64');

    const transcriptionResult = await transcriptionService.transcribe(audioBuffer, options);
    if (!transcriptionResult) {
        throw new Error('Failed to transcribe audio');
    }

    // Extract the text from the transcription result and flatten the response  
    return {
        success: true,
        text: transcriptionResult.text || transcriptionResult,  // Handle both object and string responses  
        timestamp: new Date().toISOString()
    };
}

async function importService(serviceId) {
    const servicePath = SERVICES_MAP.get(serviceId);

    if (!servicePath) {
        throw new Error("Requested transcription service is not available");
    }

    try {
        const module = await import(servicePath);
        return new module.default();
    } catch (err) {
        logger.error(`Failed to import service: ${serviceId}`, err);
        throw new Error('Transcription service loading failed');
    }
}

function handleErrorMessage(ws, error) {
    const errorResponse = {
        success: false,
        error: 'Transcription Error',
        details: error.message,
        type: error.name === 'ValidationError' ? 'ClientError' : 'ServerError',
        timestamp: new Date().toISOString()
    };

    safeSend(ws, errorResponse);
}

function safeSend(ws, message) {
    const msgToSend = typeof message === 'object' ? JSON.stringify(message) : message;

    if (ws.readyState === WebSocket.OPEN) {
        try {
            ws.send(msgToSend);
        } catch (error) {
            logger.error('Error sending message:', error);
        }
    } else {
        logger.warn('WebSocket is not in OPEN state. Current state:', ws.readyState);
    }
}

// Example usage:  
/*  
const wss = new WebSocket.Server({ port: 8080 });  
setupWebSocket(wss);  
*/
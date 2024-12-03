import { WebSocketServer, WebSocket } from 'ws'; 
import { logger } from '../logger.mjs';

const HEARTBEAT_INTERVAL = 30000;
const CLIENT_TIMEOUT = 35000;

const SERVICES_MAP = new Map([
    ['ExampleSTTService', './exampleSTTService.mjs'],
    ['AnotherSTTService', './anotherSTTService.mjs'],
    ['OpenAITranscriptionService', './OpenAITranscriptionService.mjs']
]);

export class WebSocketHandler {
    constructor(server) {
        this.wss = new WebSocketServer({ server });
        this.heartbeatInterval = null;
        this.init();
    }

    init() {
        this.wss.on('connection', this.handleConnection.bind(this));
        this.setupHeartbeat();
    }

    handleConnection(ws) {
        ws.isAlive = true;
        ws.on('pong', () => ws.isAlive = true);
        ws.on('message', (msg) => this.handleMessage(ws, msg));
        ws.on('error', (error) => this.handleError(ws, error));
        ws.on('close', () => this.handleClose(ws));
    }

    setupHeartbeat() {
        this.heartbeatInterval = setInterval(() => {
            this.wss.clients.forEach(ws => {
                if (ws.isAlive === false) return ws.terminate();
                ws.isAlive = false;
                ws.ping();
            });
        }, HEARTBEAT_INTERVAL);

        this.wss.on('close', () => {
            clearInterval(this.heartbeatInterval);
        });
    }

    async handleMessage(ws, messageData) {
        try {
            const transcription = await this.parseAndProcessMessage(messageData);
            this.safeSend(ws, transcription);
        } catch (error) {
            logger.error(`Error processing message: ${error.message}`);
            this.handleErrorMessage(ws, error);
        }
    }

    handleError(ws, error) {
        logger.error('WebSocket error:', error);
    }

    handleClose(ws) {
        ws.isAlive = false;
        logger.info('WebSocket connection closed');
    }

    async parseAndProcessMessage(messageData) {
        const parsedData = this.parseMessageData(messageData);
        const { options, audioData } = parsedData;

        if (!options?.serviceId || !audioData) {
            throw new Error('Invalid message format: missing required fields');
        }

        const transcriptionService = await this.importService(options.serviceId);
        const audioBuffer = Buffer.from(audioData, 'base64');
        const transcriptionResult = await transcriptionService.transcribe(audioBuffer, options);

        if (!transcriptionResult) {
            throw new Error('Failed to transcribe audio');
        }

        return {
            success: true,
            text: transcriptionResult.text || transcriptionResult,
            timestamp: new Date().toISOString()
        };
    }

    parseMessageData(messageData) {
        try {
            return messageData instanceof Buffer
                ? JSON.parse(messageData.toString())
                : JSON.parse(messageData);
        } catch (err) {
            logger.error('JSON parsing failed.', err);
            throw new Error('Invalid JSON format');
        }
    }

    async importService(serviceId) {
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

    handleErrorMessage(ws, error) {
        const errorResponse = {
            success: false,
            error: 'Transcription Error',
            details: error.message,
            type: error.name === 'ValidationError' ? 'ClientError' : 'ServerError',
            timestamp: new Date().toISOString()
        };

        this.safeSend(ws, errorResponse);
    }

    safeSend(ws, message) {
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
}

export default function setupWebSocket(server) {
    return new WebSocketHandler(server);
}  
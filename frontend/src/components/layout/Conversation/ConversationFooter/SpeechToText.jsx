import React, { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';

const AudioRecorder = ({ setInput, isStreaming, setError }) => {
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const webSocketRef = useRef(null);

    const handleOpen = useCallback(() => console.log("WebSocket Connected"), []);
    const handleMessage = useCallback((event) => {
        try {
            const message = JSON.parse(event.data);
            if (message.text) {
                setInput(prevInput => `${prevInput} ${message.text}`);
            } else {
                setError("Error: " + event.data);
            }
        } catch (error) {
            setError("Error: " + error + event.data);
        }
    }, [setInput, setError]);
    const handleError = useCallback((error) => console.error("WebSocket Error: ", error), []);

    const initializeWebSocket = useCallback(() => {
        return new Promise((resolve, reject) => {
            try {
                const ws = new WebSocket('ws://localhost:8001');
                ws.addEventListener('open', () => {
                    resolve(ws); // Resolve the promise with the WebSocket instance on successful connection
                });
                ws.addEventListener('message', handleMessage);
                ws.addEventListener('error', (error) => {
                    console.error("WebSocket Error: ", error);
                    reject(error); // Reject the promise on error
                });
            } catch (error) {
                reject(error); // Reject the promise on exception
            }
        });
    }, [handleMessage]);

    const convertBlobToBase64 = useCallback((blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    }), []);

    const startRecording = useCallback(async () => {
        try {
            const ws = await initializeWebSocket(); // Wait for WebSocket to initialize
            webSocketRef.current = ws; // Set the WebSocket reference

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
            mediaRecorderRef.current.start();

            const audioChunks = [];
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunks);
                const base64Data = await convertBlobToBase64(audioBlob);
                if (webSocketRef.current.readyState === WebSocket.OPEN) {
                    const message = JSON.stringify({
                        options: { serviceId: 'OpenAITranscriptionService' },
                        audioData: base64Data
                    });
                    webSocketRef.current.send(message);
                }

                stream.getTracks().forEach(track => track.stop());
            };

            setIsRecording(true);
        } catch (error) {
            setError("Error starting recording or WebSocket connection: " + error);
            console.error("Error starting recording or WebSocket connection: ", error);
        }
    }, [initializeWebSocket, convertBlobToBase64, setError]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    }, []);

    const buttonText = isRecording ? '▪' : '🎤';
    return (
        <div>
            <button disabled={isStreaming} onClick={isRecording ? stopRecording : startRecording}>
                {buttonText}
            </button>
        </div>
    );
};

AudioRecorder.propTypes = {
    setInput: PropTypes.func.isRequired,
    isStreaming: PropTypes.bool.isRequired,
    setError: PropTypes.func.isRequired
};

export default AudioRecorder;
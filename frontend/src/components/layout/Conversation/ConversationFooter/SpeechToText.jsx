import React, { useState, useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";


import { SERVER_WEBSOCKET_URL } from '../../../../config/config';
const AudioRecorder = ({ setInput, isStreaming, setError }) => {
    const { t } = useTranslation();
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef(null);
    const webSocketRef = useRef(null);

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

    const initializeWebSocket = useCallback(() => {
        return new Promise((resolve, reject) => {
            try {
                const ws = new WebSocket(`${SERVER_WEBSOCKET_URL}`);
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

            mediaRecorderRef.current.onstart = () => {
                setIsRecording(true);
            };

            mediaRecorderRef.current.onstop = async () => {
                setIsRecording(false); // Move setIsRecording(false) from stopRecording to here

                const audioBlob = new Blob(audioChunks);
                const base64Data = await convertBlobToBase64(audioBlob);
                // log base64Data size to console
                console.log("base64Data size", base64Data.length);
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
        }
    }, []);

    useEffect(() => {
        return () => {
            if (webSocketRef.current) {
                webSocketRef.current.close();
            }
        };
    }, []);
    const buttonText = isRecording ? t("stop_recording") : t("start_recording");
    const titleText = isRecording ? t("stop_recording_title") : t("start_recording_title");
    return (
        <div>
            <button title={titleText} disabled={isStreaming} onClick={isRecording ? stopRecording : startRecording}>
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
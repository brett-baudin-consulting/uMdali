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
                setError(`Error: ${event.data}`);  
            }  
        } catch (error) {  
            setError(`Error: ${error.message} ${event.data}`);  
        }  
    }, [setInput, setError]);

    const initializeWebSocket = useCallback(() => {  
        return new Promise((resolve, reject) => {  
            try {  
                const ws = new WebSocket(SERVER_WEBSOCKET_URL);  
                ws.onopen = () => resolve(ws);  
                ws.onmessage = handleMessage;  
                ws.onerror = reject;  
            } catch (error) {  
                reject(error);  
            }  
        });  
    }, [handleMessage]);


    const convertBlobToBase64 = useCallback((blob) => new Promise((resolve, reject) => {  
        const reader = new FileReader();  
        reader.onloadend = () => resolve(reader.result.split(',')[1]);  
        reader.onerror = reject;  
        reader.readAsDataURL(blob);  
    }), []);


    const startRecording = useCallback(async () => {  
        try {  
            const ws = await initializeWebSocket();  
            webSocketRef.current = ws;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });  
            mediaRecorderRef.current = new MediaRecorder(stream);  
            const audioChunks = [];

            mediaRecorderRef.current.ondataavailable = (event) => {  
                audioChunks.push(event.data);  
            };

            mediaRecorderRef.current.onstop = async () => {  
                setIsRecording(false);  
                const audioBlob = new Blob(audioChunks);  
                const base64Data = await convertBlobToBase64(audioBlob);

                if (webSocketRef.current && webSocketRef.current.readyState === WebSocket.OPEN) {  
                    webSocketRef.current.send(JSON.stringify({  
                        options: { serviceId: 'OpenAITranscriptionService' },  
                        audioData: base64Data  
                    }));  
                }

                stream.getTracks().forEach(track => track.stop());  
            };

            mediaRecorderRef.current.start();  
            setIsRecording(true);  
        } catch (error) {  
            setError(`Error starting recording or WebSocket connection: ${error.message}`);  
            console.error("Error starting recording:", error);  
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
        <button  
            title={titleText}  
            disabled={isStreaming}  
            onClick={isRecording ? stopRecording : startRecording}  
        >  
            {buttonText}  
        </button>  
    );  
};

AudioRecorder.propTypes = {  
    setInput: PropTypes.func.isRequired,  
    isStreaming: PropTypes.bool.isRequired,  
    setError: PropTypes.func.isRequired  
};

export default AudioRecorder;
// AudioRecorder.jsx  
import React, { useState, useRef, useCallback, useEffect } from 'react';  
import PropTypes from 'prop-types';  
import { useTranslation } from 'react-i18next';  
import { SERVER_WEBSOCKET_URL } from '../../../../config/config';  
import './AudioRecorder.scss';

const AudioRecorder = ({ setInput, isStreaming, setError }) => {  
    const { t } = useTranslation();  
    const [isRecording, setIsRecording] = useState(false);  
    const mediaRecorderRef = useRef(null);  
    const webSocketRef = useRef(null);  
    const audioChunksRef = useRef([]);

    const handleMessage = useCallback((event) => {  
        try {  
            const message = JSON.parse(event.data);  
            if (message.text) {  
                setInput(prevInput => prevInput ? `${prevInput} ${message.text}` : message.text);  
            } else {  
                setError(`Error: ${event.data}`);  
            }  
        } catch (error) {  
            setError(`Error: ${error.message} - ${event.data}`);  
        }  
    }, [setInput, setError]);

    const initializeWebSocket = useCallback(() => {  
        return new Promise((resolve, reject) => {  
            const ws = new WebSocket(SERVER_WEBSOCKET_URL);  
              
            ws.addEventListener('open', () => resolve(ws));  
            ws.addEventListener('message', handleMessage);  
            ws.addEventListener('error', (error) => {  
                console.error('WebSocket Error:', error);  
                reject(error);  
            });  
            ws.addEventListener('close', () => {  
                console.log('WebSocket connection closed');  
            });  
        });  
    }, [handleMessage]);

    const convertBlobToBase64 = useCallback((blob) => {  
        return new Promise((resolve, reject) => {  
            const reader = new FileReader();  
            reader.onloadend = () => resolve(reader.result.split(',')[1]);  
            reader.onerror = reject;  
            reader.readAsDataURL(blob);  
        });  
    }, []);

    const handleRecordingStop = useCallback(async (stream) => {  
        setIsRecording(false);  
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });  
        audioChunksRef.current = [];

        try {  
            const base64Data = await convertBlobToBase64(audioBlob);  
            if (webSocketRef.current?.readyState === WebSocket.OPEN) {  
                const message = JSON.stringify({  
                    options: { serviceId: 'OpenAITranscriptionService' },  
                    audioData: base64Data  
                });  
                webSocketRef.current.send(message);  
            }  
        } catch (error) {  
            setError(`Error processing audio: ${error.message}`);  
        } finally {  
            stream.getTracks().forEach(track => track.stop());  
        }  
    }, [convertBlobToBase64, setError]);

    const startRecording = useCallback(async () => {  
        try {  
            const ws = await initializeWebSocket();  
            webSocketRef.current = ws;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });  
            mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });  
              
            mediaRecorderRef.current.ondataavailable = (event) => {  
                audioChunksRef.current.push(event.data);  
            };

            mediaRecorderRef.current.onstart = () => setIsRecording(true);  
            mediaRecorderRef.current.onstop = () => handleRecordingStop(stream);

            mediaRecorderRef.current.start();  
        } catch (error) {  
            setError(`Error starting recording: ${error.message}`);  
            console.error('Recording error:', error);  
        }  
    }, [initializeWebSocket, handleRecordingStop, setError]);

    const stopRecording = useCallback(() => {  
        if (mediaRecorderRef.current?.state !== 'inactive') {  
            mediaRecorderRef.current.stop();  
        }  
    }, []);

    useEffect(() => {  
        return () => {  
            if (webSocketRef.current) {  
                webSocketRef.current.close();  
            }  
            if (mediaRecorderRef.current?.state !== 'inactive') {  
                mediaRecorderRef.current.stop();  
            }  
        };  
    }, []);

    return (  
        <button   
            className={`audio-recorder-button ${isRecording ? 'recording' : ''}`}  
            title={isRecording ? t('stop_recording_title') : t('start_recording_title')}  
            disabled={isStreaming}  
            onClick={isRecording ? stopRecording : startRecording}  
        >  
            {isRecording ? t('stop_recording') : t('start_recording')}  
        </button>  
    );  
};

AudioRecorder.propTypes = {  
    setInput: PropTypes.func.isRequired,  
    isStreaming: PropTypes.bool.isRequired,  
    setError: PropTypes.func.isRequired  
};

export default AudioRecorder;  
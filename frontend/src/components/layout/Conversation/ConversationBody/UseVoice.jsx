import { useState, useRef, useCallback, useEffect } from 'react';  
import { convertTextToSpeech } from '../../../../api/textToSpeechModelService';

const pauseDuration = 500;

export default function useVoice(user, currentConversation, message, setError) {  
    const [isSpeaking, setIsSpeaking] = useState(false);  
    const audioRef = useRef(null);  
    const abortControllerRef = useRef(null);

    function getVoice(currentConversation, message, userSettings) {  
        if (currentConversation.isAIConversation && currentConversation.voice1 && currentConversation.voice2) {  
            const index = currentConversation.messages.findIndex(mess => mess.messageId === message.messageId);  
            if (index === -1) {  
                return userSettings.textToSpeechModel.voice_id;  
            }  
            return index % 2 === 0 ? currentConversation.voice1 : currentConversation.voice2;  
        }  
        return userSettings.textToSpeechModel.voice_id;  
    }

    const voice = getVoice(currentConversation, message, user.settings);  
    const textToSpeechVendor = (currentConversation.isAIConversation ? currentConversation.textToSpeechVendor : user.settings.textToSpeechModel.vendor) ?? user.settings.textToSpeechModel.vendor;  
    const textToSpeechModelId = (currentConversation.isAIConversation ? currentConversation.textToSpeechModelId : user.settings.textToSpeechModel.model_id) ?? user.settings.textToSpeechModel.model_id;

    const stopPlayback = useCallback(() => {  
        if (audioRef.current) {  
            audioRef.current.pause();  
            audioRef.current.currentTime = 0;  
        }  
        if (abortControllerRef.current) {  
            abortControllerRef.current.abort();  
        }  
        setIsSpeaking(false);  
    }, []);

    useEffect(() => {  
        return () => {  
            stopPlayback();  
            if (audioRef.current) {  
                URL.revokeObjectURL(audioRef.current.src);  
            }  
        };  
    }, [stopPlayback]);

    const handleSpeakClick = useCallback(async () => {  
        if (isSpeaking) {  
            stopPlayback();  
            return;  
        }

        setError(null);  
        setIsSpeaking(true);  
        abortControllerRef.current = new AbortController();  
        const signal = abortControllerRef.current.signal;

        const textChunks = message.content.split('\n').filter(chunk => chunk.trim() !== '');

        const convertChunkToSpeech = async (chunk) => {  
            if (signal.aborted) {  
                throw new Error('Playback aborted');  
            }  
            return convertTextToSpeech(  
                textToSpeechModelId,  
                chunk,  
                voice,  
                textToSpeechVendor,  
                signal  
            );  
        };

        const playAudioBlob = async (audioBlob) => {  
            return new Promise((resolve, reject) => {  
                const audioUrl = URL.createObjectURL(audioBlob);  
                if (audioRef.current) {  
                    URL.revokeObjectURL(audioRef.current.src);  
                }  
                audioRef.current = new Audio(audioUrl);

                const handleAbort = () => {  
                    URL.revokeObjectURL(audioUrl);  
                    reject(new Error('Playback aborted'));  
                };

                audioRef.current.onended = () => {  
                    URL.revokeObjectURL(audioUrl);  
                    signal.removeEventListener('abort', handleAbort);  
                    resolve();  
                };

                audioRef.current.onerror = (error) => {  
                    URL.revokeObjectURL(audioUrl);  
                    signal.removeEventListener('abort', handleAbort);  
                    reject(new Error('Playback error'));  
                };

                signal.addEventListener('abort', handleAbort);  
                audioRef.current.play().catch(error => {  
                    signal.removeEventListener('abort', handleAbort);  
                    reject(error);  
                });  
            });  
        };

        const prefetchAndPlayChunks = async () => {  
            try {  
                if (textChunks.length === 0) {  
                    throw new Error('No text chunks to process');  
                }

                for (let i = 0; i < textChunks.length; i++) {  
                    if (signal.aborted) {  
                        throw new Error('Playback aborted');  
                    }

                    const audioBlob = await convertChunkToSpeech(textChunks[i]);  
                    await playAudioBlob(audioBlob);

                    if (i < textChunks.length - 1) {  
                        await new Promise((resolve, reject) => {  
                            const timeout = setTimeout(resolve, pauseDuration);  
                            signal.addEventListener('abort', () => {  
                                clearTimeout(timeout);  
                                reject(new Error('Playback aborted'));  
                            });  
                        });  
                    }  
                }  
            } catch (error) {  
                if (error.message !== 'Playback aborted') {  
                    setError(error.message);  
                }  
                throw error;  
            } finally {  
                setIsSpeaking(false);  
            }  
        };

        prefetchAndPlayChunks().catch(error => {  
            if (error.message !== 'Playback aborted') {  
                console.error('Error processing text to speech:', error);  
            }  
            setIsSpeaking(false);  
        });  
    }, [isSpeaking, message.content, setError, textToSpeechModelId, textToSpeechVendor, voice, stopPlayback]);

    return { isSpeaking, handleSpeakClick };  
}  
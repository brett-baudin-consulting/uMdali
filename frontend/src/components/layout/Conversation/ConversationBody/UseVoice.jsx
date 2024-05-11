// useVoice.js  
import { useState, useRef, useCallback } from 'react';
import { convertTextToSpeech } from '../../../../api/textToSpeechModelService';

const pauseDuration = 500;

export default function useVoice(user, currentConversation, message, setError) {
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef(null);

    // Determine the voice to use for the text-to-speech based on the conversation context
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
    
    const handleSpeakClick = useCallback(async () => {
        if (isSpeaking) {
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
            }
            setIsSpeaking(false);
            return;
        }

        setError(null);
        setIsSpeaking(true);
        const textChunks = message.content.split('\n').filter(chunk => chunk.trim() !== '');

        // Function to convert text to speech and return a promise that resolves to the audio blob
        const convertChunkToSpeech = (chunk) => {
            return convertTextToSpeech(
                textToSpeechModelId,
                chunk,
                voice,
                textToSpeechVendor
            );
        };

        // Function to play the audio blob
        const playAudioBlob = async (audioBlob) => {
            const audioUrl = URL.createObjectURL(audioBlob);
            if (audioRef.current) {
                URL.revokeObjectURL(audioRef.current.src); // Clean up previous audio object URL
            }
            audioRef.current = new Audio(audioUrl);

            return new Promise((resolve) => {
                audioRef.current.onended = () => resolve();
                audioRef.current.play().catch(err => {
                    console.error('Playback error:', err);
                    setError('Playback error');
                });
            });
        };

        // Asynchronously prefetch and play audio chunks
        const prefetchAndPlayChunks = async () => {
            try {
                if (textChunks.length === 0) {
                    throw new Error('No text chunks to process');
                }

                let hasNextChunk = true;
                let nextChunkIndex = 0;
                let nextAudioBlobPromise = convertChunkToSpeech(textChunks[nextChunkIndex]);

                while (hasNextChunk) {
                    const currentAudioBlob = await nextAudioBlobPromise;

                    nextChunkIndex++;
                    hasNextChunk = nextChunkIndex < textChunks.length;
                    if (hasNextChunk) {
                        nextAudioBlobPromise = convertChunkToSpeech(textChunks[nextChunkIndex]);
                    }

                    await playAudioBlob(currentAudioBlob); // Play current chunk

                    // Wait for the specified pause duration before proceeding, unless it's the last chunk
                    if (hasNextChunk) {
                        await new Promise(resolve => setTimeout(resolve, pauseDuration));
                    }
                }
            } catch (error) {
                setError(error.message); // Use setError here to handle the error
            } finally {
                setIsSpeaking(false); // Reset state when all chunks have been played or an error occurs
            }
        };

        prefetchAndPlayChunks().catch(error => {
            console.error('Error processing text to speech:', error);
            setIsSpeaking(false);
        });
    }, [isSpeaking, message.content, setError, textToSpeechModelId, textToSpeechVendor, voice]);

    return { isSpeaking, handleSpeakClick };
}
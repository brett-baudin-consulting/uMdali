import { SERVER_BASE_URL } from '../config/config';

const API_ENDPOINTS = {
    TEXT_TO_SPEECH_MODEL: '/textToSpeech',
};

const fetchTextToSpeechModels = async () => {
    try {
        const response = await fetch(`${SERVER_BASE_URL}${API_ENDPOINTS.TEXT_TO_SPEECH_MODEL}`);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const models = await response.json();
        if (!models) {
            throw new Error("Unexpected response structure");
        }
        return models;
    } catch (error) {
        console.error("Error fetching models:", error);
        throw error; 
    }
};

const convertTextToSpeech = async (textToSpeechModel, text, voice_id, vendor) => {
    try {
        console.log('textToSpeechModel:', textToSpeechModel);
        console.log('text:', text);
        const response = await fetch(`${SERVER_BASE_URL}${API_ENDPOINTS.TEXT_TO_SPEECH_MODEL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ textToSpeechModel, text, vendor, voice_id }),
        });
        if (response.ok) {
            const audioBlob = await response.blob();
            return audioBlob; 
        } else {
            console.error('Error:', response.statusText);
            return { success: false, error: response.statusText }; 
        }
    } catch (error) {
        console.error('Error:', error);
        return { success: false, error };
    }
};

export { fetchTextToSpeechModels, convertTextToSpeech };
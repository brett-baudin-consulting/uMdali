// textToSpeechModelService.jsx  
import { apiClient } from './apiClient';

const API_ENDPOINTS = {  
    TEXT_TO_SPEECH_MODEL: '/textToSpeech',  
};

const fetchTextToSpeechModels = async () => {  
    try {  
        const models = await apiClient.fetch(API_ENDPOINTS.TEXT_TO_SPEECH_MODEL);  
        if (!models) {  
            throw new Error("Unexpected response structure");  
        }  
        return models;  
    } catch (error) {
        console.error("Error fetching models:", error);
        return []; // Return empty array instead of throwing  
    }
};

const convertTextToSpeech = async (textToSpeechModel, text, voice_id, vendor) => {  
    try {  
        const response = await apiClient.fetch(API_ENDPOINTS.TEXT_TO_SPEECH_MODEL, {  
            method: 'POST',  
            headers: {  
                'Content-Type': 'application/json',  
            },  
            body: JSON.stringify({ textToSpeechModel, text, vendor, voice_id }),  
            stream: true // Add this to get the raw response for blob handling  
        });  
          
        if (response.ok) {  
            const audioBlob = await response.blob();  
            return audioBlob;  
        } else {  
            const errorText = await response.text();  
            console.error('Conversion error:', errorText);  
            throw new Error(errorText);  
        }  
    } catch (error) {  
        console.error('Text to speech conversion failed:', error);  
        throw error;  
    }  
};

export { fetchTextToSpeechModels, convertTextToSpeech };  
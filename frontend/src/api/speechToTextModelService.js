import { apiClient } from './apiClient';

const fetchSpeechToTextModels = async () => {  
    try {  
        const models = await apiClient.fetch('/speechToText', {  
            method: 'GET'  
        });  
          
        if (!models) {  
            throw new Error("Unexpected response structure");  
        }  
          
        return models;  
    } catch (error) {  
        console.error("Error fetching models:", error);  
        throw error;  
    }  
};

export { fetchSpeechToTextModels };  
import { apiClient } from './apiClient';

const fetchSpeechToTextModels = async () => {
    try {
        const response = await apiClient.fetch('/speechToText', {
            method: 'GET'
        });

        if (!response.success) {
            throw new Error(response.message || 'Error fetching speech to text models.');
        }
        const models = Array.isArray(response.data) ? response.data : [];
        return models;
    } catch (error) {
        console.error("Error fetching models:", error);
        return []; // Return empty array instead of throwing  
    }
};

export { fetchSpeechToTextModels };  
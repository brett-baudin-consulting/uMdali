import { apiClient } from './apiClient';

const fetchModels = async () => {
    try {
        const models = await apiClient.fetch('/model');
        if (!models) {
            throw new Error("Unexpected response structure");
        }
        return models;
    } catch (error) {
        console.error("Error fetching models:", error);
        throw error;
    }
};

export { fetchModels };  
import { SERVER_BASE_URL } from '../config/config';

const fetchModels = async () => {
    try {
        const response = await fetch(`${SERVER_BASE_URL}/model`);
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
export { fetchModels };
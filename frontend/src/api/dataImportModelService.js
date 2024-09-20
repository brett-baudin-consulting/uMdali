import { SERVER_BASE_URL } from '../config/config';

const API_ENDPOINTS = {
    DATA_IMPORT_MODEL: '/dataImportModel',
    DATA_IMPORT: '/dataImport',
};

const fetchDataImportModels = async () => {
    try {
        const response = await fetch(`${SERVER_BASE_URL}${API_ENDPOINTS.DATA_IMPORT_MODEL}`);
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

const importData = async (user, dataImport) => {
    try {
        const response = await fetch(`${SERVER_BASE_URL}${API_ENDPOINTS.DATA_IMPORT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user, dataImport }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error1:', errorText);
            throw new Error(errorText);
        }
    } catch (error) {
        console.error('Error2:', error);
        throw error;
    }
};

export { fetchDataImportModels, importData };
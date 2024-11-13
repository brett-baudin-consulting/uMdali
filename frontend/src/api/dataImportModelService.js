// dataImportModelService.jsx  
import { apiClient } from './apiClient';

const API_ENDPOINTS = {  
    DATA_IMPORT_MODEL: '/dataImportModel',  
    DATA_IMPORT: '/dataImport',  
};

const fetchDataImportModels = async () => {  
    try {  
        const models = await apiClient.fetch(API_ENDPOINTS.DATA_IMPORT_MODEL);  
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
        await apiClient.fetch(API_ENDPOINTS.DATA_IMPORT, {  
            method: 'POST',  
            body: JSON.stringify({ user, dataImport }),  
        });  
    } catch (error) {  
        console.error('Error importing data:', error);  
        throw error;  
    }  
};

export { fetchDataImportModels, importData };  
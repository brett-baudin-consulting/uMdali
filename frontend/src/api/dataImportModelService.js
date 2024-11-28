import { apiClient } from './apiClient';

const API_ENDPOINTS = {
    DATA_IMPORT_MODEL: '/dataImportModel',
    DATA_IMPORT: '/dataImport',
};

const fetchDataImportModels = async () => {
    try {
        const response = await apiClient.fetch(API_ENDPOINTS.DATA_IMPORT_MODEL);
        if (!response.success) {
            throw new Error(response.message || 'Error fetching data import models.');
        }
        return response.data;
    } catch (error) {
        console.error("Error fetching models:", error);
        throw error;
    }
};

const importData = async (user, dataImport) => {
    try {
        const response = await apiClient.fetch(API_ENDPOINTS.DATA_IMPORT, {
            method: 'POST',
            body: JSON.stringify({ user, dataImport }),
        });
        if (!response.success) {
            throw new Error(response.message || 'Error importing data.');
        }
    } catch (error) {
        console.error('Error importing data:', error);
        throw error;
    }
};

export { fetchDataImportModels, importData };  
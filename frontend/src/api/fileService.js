// fileService.jsx  
import { apiClient } from './apiClient';

export const uploadFile = async (userId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    return await apiClient.fetch(`/file/${userId}`, {
      method: 'POST',
      body: formData,
    });
  } catch (error) {
    throw new Error(`Error uploading file: ${error.message}`);
  }
};

export const deleteFile = async (userId, fileName) => {
  try {
    return await apiClient.fetch(`/file/${userId}/${fileName}`, {
      method: 'DELETE',
    });
  } catch (error) {
    throw new Error(`Error deleting file: ${error.message}`);
  }
};

export const fetchBlobUrl = async (path) => {
  try {
    const response = await apiClient.fetch(path, {
      responseType: 'blob',
    });
    return URL.createObjectURL(response);
  } catch (error) {
    throw new Error(`Error fetching blob: ${error.message}`);
  }
};

export const fetchImage = async (userId, fileName) => {
  return this.fetchBlobUrl(`/file/${userId}/image/${fileName}`);
};

export const fetchIcon = async (userId, file) => {
  if (file.type.startsWith('image/')) {
    return this.fetchBlobUrl(`/file/${userId}/image/${file.name}`);
  }
  return this.fetchBlobUrl('/public/images/standard_icon.png');
};

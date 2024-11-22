import { apiClient } from './apiClient';

const FALLBACK_ICON = '/public/images/fallback_icon.png';
const STANDARD_ICON = '/public/images/standard_icon.png';

export const fetchBlobUrl = async (path) => {
  try {
    const blob = await apiClient.fetch(path, {
      responseType: 'blob',
    });

    if (!(blob instanceof Blob)) {
      console.error('Invalid response type received');
      return FALLBACK_ICON;
    }

    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('Error fetching blob:', error);
    return FALLBACK_ICON;
  }
};

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

export const fetchIcon = async (userId, file) => {
  try {
    if (file.type.startsWith('image/')) {
      // Split the filename into name and extension  
      const lastDotIndex = file.name.lastIndexOf('.');
      const name = file.name.substring(0, lastDotIndex);
      const extension = file.name.substring(lastDotIndex);

      // Create new filename with "_icon" before extension  
      const iconFileName = `${name}_icon${extension}`;

      return fetchBlobUrl(`/file/${userId}/${iconFileName}`);
    }
  }
  catch (error) {
    console.error('Failed to fetch icon:', error);
    return fetchBlobUrl('/public/images/standard_icon.png');
  }
};

export const fetchImageFile = async (userId, file) => {
  try {
    return fetchBlobUrl(`/file/${userId}/${file.name}`);
  }
  catch (error) {
    console.error('Failed to fetch icon:', error);
    return fetchBlobUrl('/public/images/standard_icon.png');
  }
}; 
import { SERVER_BASE_URL } from '../config/config';

export const uploadFile = async (userId, file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${SERVER_BASE_URL}/file/${userId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error during file upload: ${errorText} (Status: ${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Error uploading file: ${error.message}`);
  }
};

export const deleteFile = async (userId, fileName) => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/file/${userId}/${fileName}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error during file deletion: ${errorText} (Status: ${response.status})`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Error deleting file: ${error.message}`);
  }
};

// Generic function to fetch a blob and return a URL
const fetchBlobUrl = async (path) => {
  const response = await fetch(path);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Error during blob retrieval: ${errorText} (Status: ${response.status})`);
  }
  const blob = await response.blob();
  return URL.createObjectURL(blob);
};

export const fetchImage = (userId, fileName) => {
  return fetchBlobUrl(`${SERVER_BASE_URL}/file/${userId}/image/${fileName}`);
};

export const fetchIcon = (userId, file) => {
  if (file.type.startsWith('image/')) {
    return fetchBlobUrl(`${SERVER_BASE_URL}/file/${userId}/image/${file.name}`);
  }
  else
  {
    return fetchBlobUrl(`${SERVER_BASE_URL}/public/images/standard_icon.png`);
  }
};

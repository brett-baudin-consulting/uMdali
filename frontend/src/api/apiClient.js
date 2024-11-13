import { SERVER_BASE_URL } from '../config/config';
import { COMMON_HEADERS } from '../constants';

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status} ${errorText}`);
  }

  const contentType = response.headers.get('content-type');
  if (response.status === 204) return null;
  return contentType?.includes('application/json') ? await response.json() : null;
};

export const apiClient = {
  async fetch(endpoint, options = {}) {
    const url = `${SERVER_BASE_URL}${endpoint}`;
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...COMMON_HEADERS,
          ...options.headers,
        },
      });
      return await handleResponse(response);
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
};  
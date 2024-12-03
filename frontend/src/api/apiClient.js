// apiClient.jsx  
import { SERVER_BASE_URL } from '../config/config';

export const apiClient = {
  async fetch(endpoint, options = {}) {
    const url = `${SERVER_BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
    };

    // Don't set Content-Type for FormData  
    if (options.body instanceof FormData) {
      delete defaultHeaders['Content-Type'];
    }

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Handle different response types  
    if (options.responseType === 'blob') {
      return response.blob();
    }

    if (options.stream) {
      return response;
    }

    // Check if the response is a stream  
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/event-stream')) {
      return response;
    }

    // Default to JSON parsing  
    return response.json();
  }
};  
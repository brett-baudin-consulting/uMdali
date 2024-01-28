import { SERVER_BASE_URL } from '../config/config';
import { COMMON_HEADERS } from '../constants';

const handleResponse = async (response) => {
  if (response.ok) {
    return { data: await response.json(), error: undefined };
  }
  const contentType = response.headers.get('content-type');
  const errorData = contentType && contentType.toLowerCase().includes('application/json')
    ? await response.json()
    : await response.text();
  return {
    error: {
      message: errorData?.message || 'Server responded with an error',
      status: response.status,
      response: errorData,
    },
  };
};

export const login = async (username, password) => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        ...COMMON_HEADERS,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    return handleResponse(response); // Removed await
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : 'An error occurred during the request',
        status: typeof error.status === 'number' ? error.status : undefined,
      },
    };
  }
};
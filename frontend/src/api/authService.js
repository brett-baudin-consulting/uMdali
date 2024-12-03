import { apiClient } from './apiClient';

export const authService = {
  async login(username, password) {
    try {
      const response = await apiClient.fetch('/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      return { data: response, error: undefined };
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'An error occurred during login',
          status: error.status,
        },
      };
    }
  },
};  
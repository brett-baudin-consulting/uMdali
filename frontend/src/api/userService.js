import { v4 as uuidv4 } from "uuid";

import { SERVER_BASE_URL } from "../config/config";
import { COMMON_HEADERS } from "../constants";
const defaultUser = {
  settings: {
    model: "gpt-4-1106-preview",
    temperature: 0.5,
    maxTokens: 2000,
    isStreamResponse: true,
    contexts: [
      {
        name: "default",
        contextId: uuidv4(),
        text: "You are a helpful AI assisstant.",
        isDefault: true,
      },
    ],
  },
};

export const createUser = async (user) => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/users`, {
      method: "POST",
      headers: COMMON_HEADERS,
      body: JSON.stringify(user),
    });
    return response.json();
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (user) => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/users/${user.userId}`, {
      method: "PUT",
      headers: COMMON_HEADERS,
      body: JSON.stringify(user),
    });
    return response.json();
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/users/${userId}`, {
      method: "GET",
    });
    if (response.status === 404) {
      defaultUser.userId = userId;
      defaultUser.name = userId;
      return await createUser(defaultUser);
    }
    return response.json();
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/users`, {
      method: "GET",
    });
    return response.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${SERVER_BASE_URL}/users/${userId}`, {
      method: "DELETE",
    });
    return response.json();
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};

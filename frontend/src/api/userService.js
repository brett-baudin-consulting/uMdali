import { v4 as uuidv4 } from "uuid";
import { apiClient } from "./apiClient";

const defaultUser = {
  settings: {
    model: "gpt-40",
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
    macros: [{
      "shortcut": "alt+i",
      "text": "Ignore all other problems and make only this change.",
      "macroId": uuidv4(),
    }],
  },
};

export const createUser = async (user) => {
  try {
    console.log("User not found, creating new user  with default settings", user);
    return await apiClient.fetch("/users", {
      method: "POST",
      body: JSON.stringify(user),
    });
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

export const updateUser = async (user) => {
  try {
    return await apiClient.fetch(`/users/${user.userId}`, {
      method: "PUT",
      body: JSON.stringify(user),
    });
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
};

export const getUser = async (userId) => {
  try {
    const response = await apiClient.fetch(`/users/${userId}`, {
      method: "GET",
    }).catch(async (error) => {
      console.error("User not found, fetching default user", error);
      if (error.message.includes("404")) {
        defaultUser.userId = userId;
        defaultUser.name = userId;
        return await createUser(defaultUser);
      }
      throw error;
    });
    return response;
  } catch (error) {
    console.error("Error fetching user:", error);
    throw error;
  }
};

export const getAllUsers = async () => {
  try {
    return await apiClient.fetch("/users", {
      method: "GET",
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const deleteUser = async (userId) => {
  try {
    return await apiClient.fetch(`/users/${userId}`, {
      method: "DELETE",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
};  
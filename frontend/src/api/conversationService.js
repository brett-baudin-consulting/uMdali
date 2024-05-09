import { SERVER_BASE_URL } from "../config/config";
import { COMMON_HEADERS } from '../constants';
import { useState, useEffect } from "react";

// Helper function for making API calls
const fetchAPI = async (url, options = {}) => {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status} ${errorText}`);
    }
    if (response.status === 204) {
      return null;
    }
    const contentType = response.headers.get("content-type");
    const jsonResponse = contentType?.includes("application/json") ? await response.json() : null;
    if (jsonResponse) {
      return jsonResponse;
    } else {
      // If the response is not JSON, return a default value or throw an error
      throw new Error('Invalid content-type. Expected "application/json"');
    }
  } catch (error) {
    console.error('fetchAPI error:', error);
    throw error;
  }
};

// Function to search conversations by query
export const searchConversations = async (query) => {
  if (!query) {
    throw new Error('Query parameter is required for searching conversations.');
  }
  const encodedQuery = encodeURIComponent(query);
  return fetchAPI(`${SERVER_BASE_URL}/conversations/search?query=${encodedQuery}`);
}

// Custom hook for fetching conversations
export const useConversations = (userId) => {
  const [conversations, setConversations] = useState([]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (userId) {
        try {
          const data = await fetchAPI(
            `${SERVER_BASE_URL}/conversations?userId=${userId}`
          );
          setConversations(data);
        } catch (error) {
          console.error("Error fetching conversations:", error);
        }
      }
    };

    fetchConversations();
  }, [userId]);

  return conversations;
};

// Function to post a new conversation
export const postConversation = async (conversationData) => {
  const options = {
    method: "POST",
    headers: COMMON_HEADERS,
    body: JSON.stringify(conversationData),
  };
  return fetchAPI(`${SERVER_BASE_URL}/conversations`, options);
};

// Function to update a conversation
export const updateConversation = async (conversationData) => {
  if (!conversationData.conversationId) {
  return Promise.reject(new Error('conversationId is required for updating a conversation.'));    
  }
  const options = {
    method: "PUT",
    headers: COMMON_HEADERS,
    body: JSON.stringify(conversationData),
  };
  return fetchAPI(
    `${SERVER_BASE_URL}/conversations/${conversationData.conversationId}`,
    options
  );
};

// Function to delete a conversation
export const deleteConversation = async (conversationId) => {
  const options = {
    method: "DELETE",
    headers: COMMON_HEADERS, // Added headers
  };
  return fetchAPI(`${SERVER_BASE_URL}/conversations/${conversationId}`, options);
};
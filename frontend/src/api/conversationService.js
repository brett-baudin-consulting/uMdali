import { apiClient } from './apiClient';  
import { useState, useEffect } from 'react';

export const searchConversations = async (query) => {  
  if (!query) {  
    throw new Error('Query parameter is required for searching conversations.');  
  }  
  const encodedQuery = encodeURIComponent(query);  
  return apiClient.fetch(`/conversations/search?query=${encodedQuery}`);  
};

export const useConversations = (userId) => {  
  const [conversations, setConversations] = useState([]);

  useEffect(() => {  
    const fetchConversations = async () => {  
      if (userId) {  
        try {  
          const data = await apiClient.fetch(`/conversations?userId=${userId}`);  
          setConversations(data);  
        } catch (error) {  
          console.error('Error fetching conversations:', error);  
        }  
      }  
    };

    fetchConversations();  
  }, [userId]);

  return conversations;  
};

export const postConversation = async (conversationData) => {  
  return apiClient.fetch('/conversations', {  
    method: 'POST',  
    body: JSON.stringify(conversationData),  
  });  
};

export const updateConversation = async (conversationData) => {  
  if (!conversationData.conversationId) {  
    throw new Error('conversationId is required for updating a conversation.');  
  }  
    
  return apiClient.fetch(`/conversations/${conversationData.conversationId}`, {  
    method: 'PUT',  
    body: JSON.stringify(conversationData),  
  });  
};

export const deleteConversation = async (conversationId) => {  
  return apiClient.fetch(`/conversations/${conversationId}`, {  
    method: 'DELETE',  
  });  
};  
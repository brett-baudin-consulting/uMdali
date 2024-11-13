// hooks/useConversationManager.jsx  
import { useState, useEffect, useCallback, useMemo } from 'react';  
import { v4 as uuidv4 } from 'uuid';  
import moment from 'moment';  
import { updateConversation, postConversation } from '../api/conversationService';  
import { useTranslation } from 'react-i18next';

export const useConversationManager = (user, isLoggedIn, fetchedConversations, isStreaming) => {  
  const [conversations, setConversations] = useState([]);  
  const [currentConversation, setCurrentConversation] = useState(null);  
  const [fetchedConversationsState, setFetchedConversationsState] = useState(fetchedConversations);  
  const { t } = useTranslation();

  // Memoize user ID to prevent unnecessary re-renders  
  const userId = useMemo(() => user?.userId, [user]);

  // Handle initial conversations setup  
  useEffect(() => {  
    if (isLoggedIn && fetchedConversations?.length > 0) {  
      setConversations(fetchedConversations);  
      setFetchedConversationsState(fetchedConversations);  
      setCurrentConversation(fetchedConversations[fetchedConversations.length - 1]);  
    }  
  }, [fetchedConversations, isLoggedIn]);

  // Handle conversation updates  
  useEffect(() => {  
    const shouldSkipUpdate = !isLoggedIn ||   
      !currentConversation?.conversationId ||   
      !currentConversation.messages.length ||   
      isStreaming;

    if (shouldSkipUpdate) return;

    const updateConversationData = async () => {  
      try {  
        await updateConversation(currentConversation);  
        setConversations(prevConversations =>   
          prevConversations.map(conversation =>   
            conversation.conversationId === currentConversation.conversationId  
              ? currentConversation  
              : conversation  
          )  
        );  
      } catch (error) {  
        console.error('Failed to update conversation:', error);  
      }  
    };

    const timeoutId = setTimeout(updateConversationData, 500); // Debounce updates

    return () => clearTimeout(timeoutId);  
  }, [currentConversation, isLoggedIn, isStreaming]);

  const createNewConversation = useCallback(async (contextName) => {  
    if (!userId) return;

    const defaultContext = user?.settings?.contexts?.find(  
      ctx => ctx.name === contextName  
    );

    const timestamp = new Date().toISOString();  
      
    const newConversation = {  
      title: moment().format(t('title_date_format')),  
      conversationId: uuidv4(),  
      userId,  
      messages: defaultContext ? [{  
        role: 'context',  
        content: defaultContext.text,  
        messageId: uuidv4(),  
      }] : [],  
      createdTimestamp: timestamp,  
      updatedTimestamp: timestamp,  
    };

    if (newConversation.messages.length > 0) {  
      try {  
        await postConversation(newConversation);  
        setConversations(prev => [...prev, newConversation]);  
        setCurrentConversation(newConversation);  
      } catch (error) {  
        console.error('Failed to create conversation:', error);  
      }  
    } else {  
      setConversations(prev => [...prev, newConversation]);  
      setCurrentConversation(newConversation);  
    }  
  }, [userId, user?.settings?.contexts, t]);

  return {  
    conversations,  
    setConversations,  
    currentConversation,  
    setCurrentConversation,  
    fetchedConversationsState,  
    setFetchedConversationsState,  
    createNewConversation,  
  };  
};  
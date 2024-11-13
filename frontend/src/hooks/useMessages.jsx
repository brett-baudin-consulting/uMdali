import { useRef, useState } from 'react';  
import { v4 as uuidv4 } from 'uuid';  
import { sendMessage } from '../api/messageService';

export const useMessageHandler = (  
  user,  
  isLoggedIn,  
  currentConversation,  
  setCurrentConversation,  
  setConversations,  
  setIsStreaming,  
  setIsWaitingForResponse,  
  getModel,
  setUser 
) => {  
  const [newBotMessage, setNewBotMessage] = useState({});  
  const [error, setError] = useState(null);  
  const abortControllerRef = useRef(null);

  const updateMessages = (message) => {  
    setCurrentConversation((prevConversation) => {  
      if (prevConversation?.messages) {  
        const updatedMessages = [...prevConversation.messages, message];

        setConversations((prevConversations) =>  
          prevConversations.map((conversation) =>  
            conversation.conversationId === prevConversation.conversationId  
              ? { ...prevConversation, messages: updatedMessages }  
              : conversation  
          )  
        );

        return { ...prevConversation, messages: updatedMessages };  
      }  
      return prevConversation;  
    });  
  };

  const createNewBotMessageAndUpdateConversation = (model, alias) => {  
    setIsStreaming(false);

    const newBotMessage = {  
      content: "",  
      role: "bot",  
      messageId: uuidv4(),  
      modelName: model,  
      alias: alias,  
    };

    updateMessages(newBotMessage);  
    setNewBotMessage(newBotMessage);  
  };

  const handleNewUserMessage = async (input, files, model, alias1, alias2) => {  
    let userModel = model;  
    if (currentConversation?.isAIConversation) {  
      userModel = 'human';  
    }  
    model = model || user?.settings?.model;  
    const newUserMessage = {  
      content: input,  
      role: "user",  
      messageId: uuidv4(),  
      files: files,  
      alias: alias2,  
      modelName: userModel,  
    };

    updateMessages(newUserMessage);  
    createNewBotMessageAndUpdateConversation(model, alias1);  
  };

  const handleResendMessage = async (model, alias) => {  
    setError(null);  
    createNewBotMessageAndUpdateConversation(model, alias);  
  };

  const processNewBotMessage = async () => {  
    if (!isLoggedIn || !currentConversation || !newBotMessage || !currentConversation.messages) {  
      return;  
    }

    abortControllerRef.current = new AbortController();

    try {  
      const model = getModel(user, currentConversation, setUser);  
      setIsWaitingForResponse(true);  
      await sendMessage(  
        currentConversation,  
        user,  
        setCurrentConversation,  
        newBotMessage.messageId,  
        setIsStreaming,  
        model,  
        abortControllerRef.current.signal,  
        setIsWaitingForResponse,  
        user?.settings?.isStreamResponse  
      );  
    } catch (err) {  
      setError(err.message);  
    }  
  };

  const abortFetch = () => {  
    if (abortControllerRef.current) {  
      try {  
        abortControllerRef.current.abort();  
      } catch (error) {  
        console.error("Failed to abort fetch:", error);  
      } finally {  
        abortControllerRef.current = null;  
      }  
    }  
  };

  return {  
    handleNewUserMessage,  
    handleResendMessage,  
    abortFetch,  
    error,  
    setError,  
    processNewBotMessage,  
    newBotMessage  
  };  
};  
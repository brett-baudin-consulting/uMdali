import React, { useState, useEffect, useRef, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import { useTranslation } from "react-i18next";
import { ThemeProvider } from './ThemeContext';
import {
  useConversations,
  updateConversation,
  postConversation,
} from "./api/conversationService";
import Sidebar from "./components/layout/Sidebar/Sidebar";
import ConversationHeader from "./components/layout/Conversation/ConversationHeader/ConversationHeader";
import ConversationBody from "./components/layout/Conversation/ConversationBody/ConversationBody";
import ConversationFooter from "./components/layout/Conversation/ConversationFooter/ConversationFooter";
import LoginDialog from "./components/common/LoginDialog/LoginDialog";
import { sendMessage, sendMessageStreamResponse } from "./api/messageService";
import { fetchModels } from "./api/modelService";
import ErrorBoundary from './ErrorBoundary';

import "./App.scss";
import "./styles/main.scss";

function App() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [newBotMessage, setNewBotMessage] = useState({});
  const [isStreaming, setIsStreaming] = useState(false);
  const [models, setModels] = useState([]);
  const { t } = useTranslation();
  const fetchedConversations = useConversations(user ? user.userId : null);
  const [sendNewMessage, setSendNewMessage] = useState(false);
  const abortControllerRef = useRef(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const hasInitialized = useRef(false);
  const [theme, setTheme] = useState('dark');
  const [error, setError] = useState(null);

  const handleLogin = async (user) => {
    setUser(user);
    setIsLoggedIn(true);
  };

  const isMountedRef = useRef(true);
  const createNewConversation = useCallback(async (contextName) => {
    if (user) {
      const conversationId = uuidv4();
      const title = moment().format(t("title_date_format"));
      const defaultContext = user?.settings?.contexts?.find((ctx) => ctx.name === contextName) || null;

      let defaultContextMessage = null;
      if (defaultContext) {
        defaultContextMessage = {
          role: "context",
          content: defaultContext.text,
          messageId: uuidv4(),
        };
      }

      const newConversation = {
        title,
        conversationId,
        userId: user.userId,
        messages: defaultContextMessage ? [defaultContextMessage] : [],
      };
      if (newConversation.messages.length > 0) {
        await postConversation(newConversation);
      }
      setConversations((prev) => [...prev, newConversation]);
      setCurrentConversation(newConversation);
    }
    // don't add user to the dependency array, otherwise it will execute this when user changes settings.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, user?.userId, user?.settings?.contexts, setConversations, setCurrentConversation]);

  useEffect(() => {
    if (user) {
      setTheme(user.settings.theme);
    }
  }, [user]);

  useEffect(() => {
    // Cleanup function to set isMountedRef to false when the component unmounts
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isLoggedIn) {
      // User has logged out, reset the initialization flag
      hasInitialized.current = false;
    } else if (isLoggedIn && !hasInitialized.current) {
      // User is logged in and conversations haven't been initialized
      (async () => {
        await createNewConversation();
        hasInitialized.current = true;
      })();
    }
  }, [isLoggedIn, createNewConversation]);

  useEffect(() => {
    if (isLoggedIn) {
      setConversations(fetchedConversations);
      if (fetchedConversations.length > 0)
        setCurrentConversation(fetchedConversations[fetchedConversations.length - 1]);
    }
  }, [createNewConversation, fetchedConversations, isLoggedIn]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setError(null);
        const modelsData = await fetchModels();
        setModels(modelsData);
      } catch (error) {
        setError(error.message);
      }
    };

    if (isLoggedIn) {
      loadModels();
    }
  }, [isLoggedIn]);

  useEffect(() => {
    // Define a flag to check if the component is still mounted
    let isMounted = true;

    // Define the async function inside useEffect
    const fetchData = async () => {
      if (isLoggedIn && currentConversation && !isStreaming && currentConversation.messages.length > 0) {
        try {
          await updateConversation(currentConversation);
          // Check if the component is still mounted before setting state
          if (isMounted) {
            setConversations((prevConversations) =>
              prevConversations.map((conversation) =>
                conversation.conversationId === currentConversation.conversationId
                  ? currentConversation
                  : conversation
              )
            );
          }
        } catch (error) {
          // Handle errors, e.g., by setting an error state (not shown here)
          console.error('Failed to update conversation', error);
        }
      }
    };

    // Call the async function
    fetchData();

    // Cleanup function to set the mounted flag to false
    return () => {
      isMounted = false;
    };
  }, [currentConversation, isLoggedIn, isStreaming]);

  useEffect(() => {
    // Only run this effect if the user is logged in
    if (isLoggedIn) {
      abortControllerRef.current = new AbortController();
      const sendMsgAndUpdateConversation = async () => {
        if (!currentConversation || !newBotMessage || !sendNewMessage) {
          return;
        }
        setIsStreaming(false);
        setIsWaitingForResponse(true);
        try {
          const data = await sendMessage(
            currentConversation,
            user,
            abortControllerRef.current.signal
          );

          setCurrentConversation((prevConversation) => ({
            ...prevConversation,
            messages: prevConversation.messages.map((message) =>
              message.messageId === newBotMessage.messageId
                ? { ...message, content: data?.content }
                : message
            ),
          }));
          setSendNewMessage(false);
        } catch (err) {
          setError(err);
        } finally {
          setSendNewMessage(false);
          setIsWaitingForResponse(false);
        }
      };

      sendMsgAndUpdateConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sendNewMessage, isLoggedIn]);

  useEffect(() => {
    if (error) {
      setIsWaitingForResponse(false);
      setIsStreaming(false);
    }
  }, [error]);

  useEffect(() => {
    // Only run this effect if the user is logged in
    if (isLoggedIn) {
      abortControllerRef.current = new AbortController();

      if (!currentConversation || !newBotMessage || !currentConversation.messages) {
        return;
      }
      if (user.settings.isStreamResponse) {
        let isCancelled = false;

        const sendStreamResponse = async () => {
          if (
            !isCancelled &&
            user &&
            currentConversation &&
            newBotMessage &&
            !isStreaming
          ) {
            setIsStreaming(true);
            try {
              await sendMessageStreamResponse(
                user,
                currentConversation,
                setCurrentConversation,
                newBotMessage,
                setIsStreaming,
                abortControllerRef.current.signal
              );

            } catch (err) {
              setError(err);
            }
          }
        };

        sendStreamResponse();
        return () => {
          isCancelled = true;
        };
      }
      else {
        setSendNewMessage(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newBotMessage, isLoggedIn]);

  if (!isLoggedIn) {
    return <LoginDialog setUser={handleLogin} />;
  }

  const createNewBotMessageAndUpdateConversation = (input) => {
    setIsStreaming(false);

    const newBotMessage = {
      content: "",
      role: "bot",
      messageId: uuidv4(),
      modelName: user.settings.model,
    };

    updateMessages(newBotMessage);

    setNewBotMessage(newBotMessage);
  };

  const handleNewUserMessage = async (input, files) => {
    const newUserMessage = {
      content: input,
      role: "user",
      messageId: uuidv4(),
      files: files,
    };

    updateMessages(newUserMessage);

    createNewBotMessageAndUpdateConversation(input);
  };

  const handleResendMessage = async (input) => {
    setError(null);
    createNewBotMessageAndUpdateConversation(input);
  };

  const updateMessages = (message) => {
    setCurrentConversation((prevConversation) => {
      if (prevConversation?.messages) {
        const updatedMessages = [
          ...prevConversation.messages,
          message,
        ];

        setConversations((prevConversations) =>
          prevConversations.map((conversation) =>
            conversation.conversationId === prevConversation.conversationId
              ? { ...prevConversation, messages: updatedMessages }
              : conversation
          )
        );

        let updatedMessagesWithoutIds = updatedMessages.map(
          ({ messageId, ...rest }) => rest
        );
        updatedMessagesWithoutIds.map((message) => {
          if (message.role === "bot") {
            return { ...message, role: "assistant" };
          }
          return message;
        });

        return { ...prevConversation, messages: updatedMessages }; // Return new state
      }
      return prevConversation; // Return previous state if condition is not met
    });
  };

  const abortFetch = () => {
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      }
      finally {
        abortControllerRef.current = null;
      }
    }
  };

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className={`App`} data-theme={theme}>
          <Sidebar
            conversations={conversations}
            currentConversation={currentConversation}
            setCurrentConversation={setCurrentConversation}
            setConversations={setConversations}
            createNewConversation={createNewConversation}
            user={user}
          />
          <div className="conversation-section">
            <ConversationHeader
              user={user}
              setUser={setUser}
              models={models}
              isLoggedIn={isLoggedIn}
              setIsLoggedIn={setIsLoggedIn}
            />
            <ConversationBody
              currentConversation={currentConversation}
              setCurrentConversation={setCurrentConversation}
              setConversations={setConversations}
            />
            {error && (
              <div className="error">
                {error.message}
              </div>
            )}
            <ConversationFooter
              user={user}
              currentConversation={currentConversation}
              setCurrentConversation={setCurrentConversation}
              onSendMessage={handleNewUserMessage}
              onResendMessage={handleResendMessage}
              isStreaming={isStreaming}
              setIsStreaming={setIsStreaming}
              abortFetch={abortFetch}
              isWaitingForResponse={isWaitingForResponse}
              setError={setError}
            />
          </div>
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;

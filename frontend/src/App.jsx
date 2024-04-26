import React, { useState, useEffect, useRef } from "react";
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
import AIConversationFooter from "./components/layout/Conversation/ConversationFooter/AIConversationFooter";
import LoginDialog from "./components/common/LoginDialog/LoginDialog";
import { sendMessage, sendMessageStreamResponse } from "./api/messageService";
import { fetchModels } from "./api/modelService";
import { fetchSpeechToTextModels } from "./api/speechToTextModelService";
import { fetchTextToSpeechModels } from "./api/textToSpeechModelService";
import ErrorBoundary from './ErrorBoundary';
import i18n from "./i18n";
import { ConversationWizard } from "./components/layout/Sidebar/ConversationWizard";

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
  const [speechToTextModels, setSpeechToTextModels] = useState([]);
  const [textToSpeechModels, setTextToSpeechModels] = useState([]);
  const { t } = useTranslation();
  const fetchedConversations = useConversations(user ? user.userId : null);
  const [sendNewMessage, setSendNewMessage] = useState(false);
  const abortControllerRef = useRef(null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [error, setError] = useState(null);
  const [isWizardVisible, setIsWizardVisible] = useState(false);

  const handleClose = () => {
    setIsWizardVisible(false);
  }

  const handleLogin = async (user) => {
    setUser(user);
    setIsLoggedIn(true);
  };
  function getModel() {
    let modelName = user.settings.model;
    if (currentConversation.isAIConversation) {
      modelName = currentConversation.messages.length % 2 === 0 ? currentConversation.model2 : currentConversation.model1;
    }
    const [vendor, name] = modelName.split('/');
    const model = models.find((model) => model.vendor === vendor && model.name === name);
    return model;
  }

  useEffect(() => {
    if (user?.settings?.language) {
      i18n.changeLanguage(user.settings.language);
    }
  }, [user]);

  const isMountedRef = useRef(true);
  const createNewConversationRef = useRef(null);
  createNewConversationRef.current = async (contextName) => {
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
  };
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
    if (isLoggedIn) {
      setConversations(fetchedConversations);
      if (fetchedConversations.length > 0)
        setCurrentConversation(fetchedConversations[fetchedConversations.length - 1]);
    }
  }, [fetchedConversations, isLoggedIn]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setError(null);
        const modelsData = await fetchModels();
        setModels(modelsData);
        const speechToTextModelsData = await fetchSpeechToTextModels();
        setSpeechToTextModels(speechToTextModelsData);
        const textToSpeechModelsData = await fetchTextToSpeechModels();
        setTextToSpeechModels(textToSpeechModelsData);
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
          const model = getModel();
          const data = await sendMessage(
            currentConversation,
            user,
            abortControllerRef.current.signal,
            model
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
          setError(err.message);
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
              const model = getModel();
              await sendMessageStreamResponse(
                user,
                currentConversation,
                setCurrentConversation,
                newBotMessage,
                setIsStreaming,
                abortControllerRef.current.signal,
                model,
              );

            } catch (err) {
              setError(err.message);
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
    if (currentConversation.isAIConversation) {
      userModel = 'human'
    }
    model = model || user.settings.model;
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
          {isLoggedIn && (
            <>
              <Sidebar
                conversations={conversations}
                currentConversation={currentConversation}
                setCurrentConversation={setCurrentConversation}
                setConversations={setConversations}
                createNewConversation={createNewConversationRef.current}
                user={user}
                setIsWizardVisible={setIsWizardVisible}
                models={models}
              />
              <div className="conversation-section">
                <ConversationHeader
                  user={user}
                  setUser={setUser}
                  models={models}
                  isLoggedIn={isLoggedIn}
                  setIsLoggedIn={setIsLoggedIn}
                  speechToTextModels={speechToTextModels}
                  textToSpeechModels={textToSpeechModels}
                />
                <ConversationBody
                  currentConversation={currentConversation}
                  setCurrentConversation={setCurrentConversation}
                  setConversations={setConversations}
                  user={user}
                  setError={setError}
                />
                {/* Optionally show error */}
                {error && <div className="error">{error}</div>}
                {currentConversation && !currentConversation?.isAIConversation && <ConversationFooter
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
                  models={models}
                />}
                {currentConversation && currentConversation?.isAIConversation && <AIConversationFooter
                  user={user}
                  currentConversation={currentConversation}
                  setCurrentConversation={setCurrentConversation}
                  onSendMessage={handleNewUserMessage}
                  onResendMessage={handleResendMessage}
                  isStreaming={isStreaming}
                  setIsStreaming={setIsStreaming}
                  abortFetch={abortFetch}
                  isWaitingForResponse={isWaitingForResponse}
                />}
              </div>
              {isWizardVisible && (
                <div className="conversationWizardOverlay">
                  <ConversationWizard
                    user={user}
                    onClose={handleClose}
                    setCurrentConversation={setCurrentConversation}
                    setConversations={setConversations}
                    onSendMessage={handleNewUserMessage}
                    models={models}
                  />
                </div>
              )}
            </>
          )}
          {!isLoggedIn && <LoginDialog setUser={handleLogin} />}
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );

}

export default App;

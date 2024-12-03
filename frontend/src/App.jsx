import { useConversations } from './api/conversationService';
import { ConversationWizard } from "./components/layout/Sidebar/ConversationWizard";
import { createTitle } from "./components/layout/Sidebar/createTitle";
import { ThemeProvider } from './ThemeContext';
import { useTranslation } from "react-i18next";
import AIConversationFooter from "./components/layout/Conversation/ConversationFooter/AIConversationFooter";
import ConversationBody from "./components/layout/Conversation/ConversationBody/ConversationBody";
import ConversationFooter from "./components/layout/Conversation/ConversationFooter/ConversationFooter";
import ConversationHeader from "./components/layout/Conversation/ConversationHeader/ConversationHeader";
import ErrorBoundary from './ErrorBoundary';
import i18n from "./i18n";
import LoginDialog from "./components/common/LoginDialog/LoginDialog";
import React, { useState, useEffect, useRef } from "react";
import Sidebar from "./components/layout/Sidebar/Sidebar";
import { useLoadModels } from "./hooks/useModels";
import { useConversationManager } from "./hooks/useConversation";
import { useMessageHandler } from "./hooks/useMessages";
import moment from "moment";

import "./App.scss";
import "./styles/main.scss";

function App() {
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const { t } = useTranslation();
  const {
    models,
    speechToTextModels,
    textToSpeechModels,
    dataImportModels,
    error: modelError,
    getModel
  } = useLoadModels(isLoggedIn);

  const fetchedConversations = useConversations(user ? user.userId : null);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [isWizardVisible, setIsWizardVisible] = useState(false);
  const [hasRun, setHasRun] = useState(false);
  const previousConversationId = useRef(null);

  const {
    conversations,
    setConversations,
    currentConversation,
    setCurrentConversation,
    fetchedConversationsState,
    setFetchedConversationsState,
    createNewConversation
  } = useConversationManager(user, isLoggedIn, fetchedConversations, isStreaming);

  const {
    handleNewUserMessage,
    handleResendMessage,
    abortFetch,
    error,
    setError,
    processNewBotMessage,
    newBotMessage
  } = useMessageHandler(
    user,
    isLoggedIn,
    currentConversation,
    setCurrentConversation,
    setConversations,
    setIsStreaming,
    setIsWaitingForResponse,
    getModel,
    setUser
  );

  useEffect(() => {
    processNewBotMessage();
    // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [newBotMessage, isLoggedIn]);

  useEffect(() => {
    if (!currentConversation ||
      currentConversation.messages?.length !== 3 ||
      currentConversation.messages[2]?.content?.length < 10 ||
      isStreaming ||
      isWaitingForResponse ||
      !user ||
      !models ||
      !models.length) {
      return;
    }

    if (previousConversationId.current !== currentConversation?.conversationId) {
      setHasRun(false);
      previousConversationId.current = currentConversation.conversationId;
    }

    const processConversation = async () => {
      const isTitleDateFormatted = moment(currentConversation?.title, t('title_date_format'), true).isValid();
      if (currentConversation.messages?.length === 3 && !hasRun && isTitleDateFormatted) {
        const newTitle = await createTitle(currentConversation, setCurrentConversation, user, models, t, setIsStreaming, setIsWaitingForResponse);
        if (newTitle) {
          setCurrentConversation(prevConversation => ({
            ...prevConversation,
            title: newTitle,
          }));
        }
        setHasRun(true);
      }
    };

    processConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps  
  }, [currentConversation?.conversationId, currentConversation?.messages?.length, currentConversation?.title, hasRun, models, t, user, isStreaming, isWaitingForResponse]);

  const handleClose = () => {
    setIsWizardVisible(false);
  }

  const handleLogin = async (user) => {
    setUser(user);
    setIsLoggedIn(true);
  };

  useEffect(() => {
    if (user?.settings?.language) {
      i18n.changeLanguage(user.settings.language);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      setTheme(user.settings.theme);
    }
  }, [user]);

  useEffect(() => {
    if (error || modelError) {
      setIsWaitingForResponse(false);
      setIsStreaming(false);
    }
  }, [error, modelError]);

  if (!isLoggedIn) {
    return <LoginDialog setUser={handleLogin} />;
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <div className={`App`} data-theme={theme}>
          {isLoggedIn && models.length && (
            <>
              <Sidebar
                conversations={conversations}
                currentConversation={currentConversation}
                setCurrentConversation={setCurrentConversation}
                setConversations={setConversations}
                createNewConversation={createNewConversation}
                user={user}
                setIsWizardVisible={setIsWizardVisible}
                models={models}
                setIsStreaming={setIsStreaming}
                setIsWaitingForResponse={setIsWaitingForResponse}
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
                  dataImportModels={dataImportModels}
                  fetchedConversations={fetchedConversationsState}
                  setFetchedConversations={setFetchedConversationsState}
                />
                <ConversationBody
                  currentConversation={currentConversation}
                  setCurrentConversation={setCurrentConversation}
                  setConversations={setConversations}
                  user={user}
                  setError={setError}
                />
                {error && <div className="error">{error}</div>}
                {currentConversation && !currentConversation?.isAIConversation && isStreaming !== undefined && (
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
                    models={models}
                  />
                )}
                {currentConversation && currentConversation?.isAIConversation && (
                  <AIConversationFooter
                    user={user}
                    currentConversation={currentConversation}
                    setCurrentConversation={setCurrentConversation}
                    onResendMessage={handleResendMessage}
                    isStreaming={isStreaming}
                    setIsStreaming={setIsStreaming}
                    abortFetch={abortFetch}
                    isWaitingForResponse={isWaitingForResponse}
                  />
                )}
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
                    textToSpeechModels={textToSpeechModels}
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
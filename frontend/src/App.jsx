import { useConversations } from "./api/conversationService";  
import { ConversationWizard } from "./components/layout/Sidebar/ConversationWizard";  
import { createTitle } from "./components/layout/Sidebar/createTitle";  
import { sendMessage } from "./api/messageService";  
import { ThemeProvider } from './ThemeContext';  
import { useTranslation } from "react-i18next";  
import { v4 as uuidv4 } from "uuid";  
import AIConversationFooter from "./components/layout/Conversation/ConversationFooter/AIConversationFooter";  
import ConversationBody from "./components/layout/Conversation/ConversationBody/ConversationBody";  
import ConversationFooter from "./components/layout/Conversation/ConversationFooter/ConversationFooter";  
import ConversationHeader from "./components/layout/Conversation/ConversationHeader/ConversationHeader";  
import ErrorBoundary from './ErrorBoundary';  
import i18n from "./i18n";  
import LoginDialog from "./components/common/LoginDialog/LoginDialog";  
import React, { useState, useEffect, useRef } from "react";  
import Sidebar from "./components/layout/Sidebar/Sidebar";  
import { useLoadModels } from "./hooks/useLoadModels";  
import { useConversationManager } from "./hooks/useConversationManager";
import moment from "moment";

import "./App.scss";  
import "./styles/main.scss";

function App() {  
  const [user, setUser] = useState(null);  
  const [isLoggedIn, setIsLoggedIn] = useState(false);  
  const [newBotMessage, setNewBotMessage] = useState({});  
  const [isStreaming, setIsStreaming] = useState(false);  
  const { t } = useTranslation();  
  const {    
    models,    
    speechToTextModels,    
    textToSpeechModels,    
    dataImportModels,    
    error: modelError    
  } = useLoadModels(isLoggedIn);  
  const fetchedConversations = useConversations(user ? user.userId : null);  
  const abortControllerRef = useRef(null);  
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);  
  const [theme, setTheme] = useState('dark');  
  const [error, setError] = useState(null);  
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
  }, [currentConversation?.conversationId, currentConversation?.messages?.length, currentConversation?.title, hasRun, models, t, user, isStreaming, isWaitingForResponse]);

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
    let model;  
    if (modelName.indexOf('/') === -1) {  
      modelName = user.settings.model;  
      model = models.find((model) => model.name === modelName)  
      setUser((prevUser) => ({  
        ...prevUser,  
        settings: {  
          ...prevUser.settings,  
          model: model.vendor + '/' + model.name,  
        },  
      }));  
    }  
    else {  
      const [vendor, name] = modelName.split('/');  
      model = models.find((model) => model.vendor === vendor && model.name === name);  
    }  
    if (!model) {  
      model = models.find((model) => model.name === 'gpt-4-turbo');  
    }  
    return model;  
  }

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

  useEffect(() => {  
    if (!isLoggedIn || !currentConversation || !newBotMessage || !currentConversation.messages) {  
      return;  
    }  
    abortControllerRef.current = new AbortController();

    try {  
      const model = getModel();  
      setIsWaitingForResponse(true);  
      const sendAndWaitForResponse = async () => {  
        try {  
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
      sendAndWaitForResponse();  
    } catch (err) {  
      setError(err.message);  
    }  
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
    if (currentConversation?.isAIConversation) {  
      userModel = 'human'  
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

        return { ...prevConversation, messages: updatedMessages };  
      }  
      return prevConversation;  
    });  
  };

  const abortFetch = () => {  
    if (abortControllerRef.current) {  
      try {  
        abortControllerRef.current.abort();  
      }  
      catch (error) {  
        console.error("Failed to abort fetch:", error);  
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
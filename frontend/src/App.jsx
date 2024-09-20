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
import { createTitle } from "./components/layout/Sidebar/createTitle";  
import ConversationHeader from "./components/layout/Conversation/ConversationHeader/ConversationHeader";  
import ConversationBody from "./components/layout/Conversation/ConversationBody/ConversationBody";  
import ConversationFooter from "./components/layout/Conversation/ConversationFooter/ConversationFooter";  
import AIConversationFooter from "./components/layout/Conversation/ConversationFooter/AIConversationFooter";  
import LoginDialog from "./components/common/LoginDialog/LoginDialog";  
import { sendMessage } from "./api/messageService";  
import { fetchModels } from "./api/modelService";  
import { fetchSpeechToTextModels } from "./api/speechToTextModelService";  
import { fetchTextToSpeechModels } from "./api/textToSpeechModelService";  
import { fetchDataImportModels } from "./api/dataImportModelService";  
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
  const [dataImportModels, setDataImportModels] = useState([]);  
  const { t } = useTranslation();  
  const fetchedConversations = useConversations(user ? user.userId : null);  
  const [fetchedConversationsState, setFetchedConversationsState] = useState(fetchedConversations);  
  const abortControllerRef = useRef(null);  
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);  
  const [theme, setTheme] = useState('dark');  
  const [error, setError] = useState(null);  
  const [isWizardVisible, setIsWizardVisible] = useState(false);  
  const [hasRun, setHasRun] = useState(false);  
  const previousConversationId = useRef(currentConversation?.conversationId);

  useEffect(() => {  
    if (!currentConversation ||   
      currentConversation.messages?.length !== 3||    
      currentConversation.messages[2]?.content?.length < 10||    
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

    const isTitleDateFormatted = moment(currentConversation?.title, t('title_date_format'), true).isValid();

    const processConversation = async () => {  
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
        title : title + ' ' + contextName,  
        conversationId,  
        userId: user.userId,  
        messages: defaultContextMessage ? [defaultContextMessage] : [],  
        createdTimestamp: new Date().toISOString(),  
        updatedTimestamp: new Date().toISOString(),  
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
      setFetchedConversationsState(fetchedConversations);  
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
        const dataImportModelsData = await fetchDataImportModels();  
        setDataImportModels(dataImportModelsData);  
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
      if (isLoggedIn && currentConversation && !isStreaming && currentConversation.messages.length > 0 && currentConversation.conversationId) {  
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
    if (error) {  
      setIsWaitingForResponse(false);  
      setIsStreaming(false);  
    }  
  }, [error]);

  useEffect(() => {  
    // Only run this effect if the user is logged in  
    if (!isLoggedIn || !currentConversation || !newBotMessage || !currentConversation.messages) {  
      return;  
    }  
    abortControllerRef.current = new AbortController();

    try {  
      const model = getModel();  
      setIsWaitingForResponse(true);  
      const sendAndWaitForResponse = async () => {  
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
      };  
      sendAndWaitForResponse();  
    } catch (err) {  
      setError(err.message);  
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
                createNewConversation={createNewConversationRef.current}  
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
                {/* Optionally show error */}  
                {error && <div className="error">{error}</div>}  
                {currentConversation && !currentConversation?.isAIConversation && isStreaming !== undefined && <ConversationFooter  
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
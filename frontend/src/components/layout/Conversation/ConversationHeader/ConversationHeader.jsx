import React, { useState, useCallback, memo } from "react";  
import { useTranslation } from "react-i18next";  
import PropTypes from "prop-types";

import SettingsDialog from "../../../common/SettingsDialog/SettingsDialog";  
import UserMenu from "./UserMenu";

import "./ConversationHeader.scss";

const SettingsButton = memo(({ onClick, label }) => (  
  <button  
    aria-label={label}  
    className="settings-button"  
    onClick={onClick}  
  >  
    {label}  
  </button>  
));

const ConversationHeader = memo(({   
  models,  
  user,  
  setUser,  
  isLoggedIn,  
  setIsLoggedIn,  
  speechToTextModels,  
  textToSpeechModels,  
  dataImportModels,  
  fetchedConversations,  
  setFetchedConversations  
}) => {  
  const { t } = useTranslation();  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSettingsClick = useCallback(() => {  
    setIsSettingsOpen(prev => !prev);  
  }, []);

  const handleCloseSettings = useCallback(() => {  
    setIsSettingsOpen(false);  
  }, []);

  return (  
    <header className="conversation-header">  
      <div className="title-container">  
        <h1>{t("app_title")}</h1>  
      </div>  
      {isLoggedIn && <UserMenu user={user} setIsLoggedIn={setIsLoggedIn} />}  
      <SettingsButton   
        onClick={handleSettingsClick}  
        label={t("settings")}  
      />  
      {isSettingsOpen && (  
        <SettingsDialog  
          onClose={handleCloseSettings}  
          user={user}  
          setUser={setUser}  
          models={models}  
          speechToTextModels={speechToTextModels}  
          textToSpeechModels={textToSpeechModels}  
          dataImportModels={dataImportModels}  
          fetchedConversations={fetchedConversations}  
          setFetchedConversations={setFetchedConversations}  
        />  
      )}  
    </header>  
  );  
});


ConversationHeader.propTypes = {
  user: PropTypes.shape({
    name: PropTypes.string,
    userId: PropTypes.string,
    settings: PropTypes.shape({
      model: PropTypes.string,
      temperature: PropTypes.number,
      maxTokens: PropTypes.number,
    }),
  }).isRequired,
  setUser: PropTypes.func.isRequired,
  models: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
    })
  ).isRequired,
  isLoggedIn: PropTypes.bool.isRequired,
  setIsLoggedIn: PropTypes.func.isRequired,
  speechToTextModels: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
    })
  ).isRequired,
  textToSpeechModels: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
    })
  ).isRequired,
  dataImportModels: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
    })
  ).isRequired,
  fetchedConversations: PropTypes.arrayOf(
    PropTypes.shape({
      conversationId: PropTypes.string,
      title: PropTypes.string,
      userId: PropTypes.string,
      messages: PropTypes.arrayOf(
        PropTypes.shape({
          messageId: PropTypes.string,
          modelName: PropTypes.string,
          content: PropTypes.string,
          role: PropTypes.string,
          files: PropTypes.arrayOf(PropTypes.object),
        })
      ),
      createdTimestamp: PropTypes.string,
      updatedTimestamp: PropTypes.string,
      isAIConversation: PropTypes.bool,
    })
  ).isRequired,
  setFetchedConversations: PropTypes.func.isRequired,
};

export default ConversationHeader;

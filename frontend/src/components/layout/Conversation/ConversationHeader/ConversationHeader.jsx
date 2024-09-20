import React, { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";

import SettingsDialog from "../../../common/SettingsDialog/SettingsDialog";
import UserMenu from "./UserMenu";

import "./ConversationHeader.scss";

const ConversationHeader = ({ models,
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
    setIsSettingsOpen((isOpen) => !isOpen);
  }, []);

  const handleCloseSettings = useCallback(() => {
    setIsSettingsOpen(false);
  }, []);

  return (
    <div className="conversation-header">
      <div className="title-container">
        <h3>{t("app_title")}</h3>
      </div>
      {isLoggedIn && <UserMenu user={user} setIsLoggedIn={setIsLoggedIn} />}
      <button
        title={t("settings_title")}
        className="settings-button"
        onClick={handleSettingsClick}
      >
        {t("settings")}
      </button>
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
    </div>
  );
};

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
          files: PropTypes.arrayOf(PropTypes.string),
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

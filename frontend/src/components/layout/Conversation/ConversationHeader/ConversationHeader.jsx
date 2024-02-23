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
  speechToTextModels }) => {
  const { t } = useTranslation();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleSettingsClick = useCallback(() => {
    setIsSettingsOpen((isOpen) => !isOpen);
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
          onClose={() => setIsSettingsOpen(false)}
          user={user}
          setUser={setUser}
          models={models}
          speechToTextModels={speechToTextModels}
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
};

export default ConversationHeader;

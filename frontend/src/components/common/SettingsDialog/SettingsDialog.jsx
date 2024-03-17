import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { updateUser } from '../../../api/userService';
import { userShape } from "../../../model/userPropType";
import Tab from "./Tab";
import GeneralTab from "./GeneralTab";
import ContextTab from "./ContextTab";
import MacroTab from "./MacroTab";
import SpeechTab from "./SpeechTab";

import "./SettingsDialog.scss";

function SettingsDialog({ onClose, models, user, setUser, speechToTextModels, textToSpeechModels }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("general");
  const modalContentRef = useRef(null);

  const handleClickOutside = useCallback((event) => {
    if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    const listener = (event) => {
      if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', listener);
    document.addEventListener('touchstart', listener);
    return () => {
      document.removeEventListener('mousedown', listener);
      document.removeEventListener('touchstart', listener);
    };
  }, [onClose]);

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab user={user} setUser={setUser} models={models} />;
      case 'speech':
        return <SpeechTab user={user} setUser={setUser} speechToTextModels={speechToTextModels} textToSpeechModels={textToSpeechModels} />;
      case 'context':
        return <ContextTab user={user} setUser={setUser} />;
      case 'macro':
        return <MacroTab user={user} setUser={setUser} />;
      default:
        return null; // or a default component
    }
  };

  const handleClose = async () => {
    try {
      if (user?.userId) {
        const updatedUser = {
          ...user,
          settings: {
            ...user.settings,
            contexts: user.settings.contexts.filter(context => context.name),
            macros: user.settings.macros.filter(macro => macro.shortcut),
            textToSpeechModel: user.settings.textToSpeechModel,
            speechToTextModel: user.settings.speechToTextModel,
          }
        };
        await updateUser(updatedUser);
        setUser(updatedUser);
      }
      onClose();
    } catch (error) {
      console.error("Failed to update user:", error);
      // Handle error appropriately
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal">
        <div className="settings-modal-content" ref={modalContentRef}>
          <div className="settings-modal-header">
            <h4>Settings</h4>
            <button onClick={handleClose}>✖</button>
          </div>
          <div className="tabs">
            <Tab
              label={t("general_settings_title")}
              isActive={activeTab === "general"}
              onClick={() => setActiveTab("general")}
            />
            <Tab
              label={t("speech_settings_title")}
              isActive={activeTab === "speech"}
              onClick={() => setActiveTab("speech")}
            />
            <Tab
              label={t("context_settings_title")}
              isActive={activeTab === "context"}
              onClick={() => setActiveTab("context")}
            />
            <Tab
              label={t("macro_settings_title")}
              isActive={activeTab === "macro"}
              onClick={() => setActiveTab("macro")}
            />
          </div>
          <div className="tab-content">{renderActiveTabContent()}</div>
        </div>
      </div>
    </div>
  );
}

SettingsDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
  models: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  speechToTextModels: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  textToSpeechModels: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default SettingsDialog;
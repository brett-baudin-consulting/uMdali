// SettingsDialog.jsx  
import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { updateUser } from '../../../api/userService';
import { userShape } from '../../../model/userPropType';
import { TABS } from './constants';
import Tab from './Tab';
import ModalHeader from './ModalHeader';
import GeneralTab from "./GeneralTab";
import ContextTab from "./ContextTab";
import MacroTab from "./MacroTab";
import SpeechTab from "./SpeechTab";
import ModelTab from "./ModelTab";
import DataTab from "./DataTab";

import './SettingsDialog.scss';

const SettingsDialog = ({
  onClose,
  models,
  user,
  setUser,
  speechToTextModels,
  textToSpeechModels,
  dataImportModels,
  fetchedConversations,
  setFetchedConversations
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const modalContentRef = useRef(null);

  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Escape') onClose();
  }, [onClose]);

  const handleClickOutside = useCallback((event) => {
    if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    const events = [
      { type: 'keydown', handler: handleKeyDown },
      { type: 'mousedown', handler: handleClickOutside },
      { type: 'touchstart', handler: handleClickOutside }
    ];

    events.forEach(({ type, handler }) =>
      document.addEventListener(type, handler)
    );

    return () => {
      events.forEach(({ type, handler }) =>
        document.removeEventListener(type, handler)
      );
    };
  }, [handleKeyDown, handleClickOutside]);

  const tabComponents = {
    general: <GeneralTab user={user} setUser={setUser} />,
    model: <ModelTab user={user} setUser={setUser} models={models} />,
    speech: <SpeechTab
      user={user}
      setUser={setUser}
      speechToTextModels={speechToTextModels}
      textToSpeechModels={textToSpeechModels}
    />,
    context: <ContextTab user={user} setUser={setUser} />,
    macro: <MacroTab user={user} setUser={setUser} />,
    data: <DataTab
      user={user}
      setUser={setUser}
      dataImportModels={dataImportModels}
      fetchedConversations={fetchedConversations}
      setFetchedConversations={setFetchedConversations}
    />
  };

  const handleClose = async () => {
    if (!user?.userId) {
      onClose();
      return;
    }

    try {
      const updatedUser = {
        ...user,
        settings: {
          ...user.settings,
          contexts: user.settings.contexts.filter(context => context.name),
          macros: user.settings.macros.filter(macro => macro.shortcut),
          textToSpeechModel: user.settings.textToSpeechModel,
          speechToTextModel: user.settings.speechToTextModel,
          dataImportModel: user.settings.dataImportModel,
        }
      };
      await updateUser(updatedUser);
      setUser(updatedUser);
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  return (
    <div className="settings-modal-overlay" role="dialog" aria-modal="true">
      <div className="settings-modal">
        <div className="settings-modal-content" ref={modalContentRef}>
          <ModalHeader onClose={handleClose} />
          <div className="tabs">
            {TABS.map(({ id, translationKey }) => (
              <Tab
                key={id}
                label={t(translationKey)}
                isActive={activeTab === id}
                onClick={() => setActiveTab(id)}
              />
            ))}
          </div>
          <div className="tab-content">
            {tabComponents[activeTab]}
          </div>
        </div>
      </div>
    </div>
  );
};

SettingsDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
  models: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
  })).isRequired,
  speechToTextModels: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
  })).isRequired,
  textToSpeechModels: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
  })).isRequired,
  dataImportModels: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
  })).isRequired,
  fetchedConversations: PropTypes.arrayOf(PropTypes.shape({
    conversationId: PropTypes.string,
    title: PropTypes.string,
    messages: PropTypes.array,
    createdTimestamp: PropTypes.string,
    updatedTimestamp: PropTypes.string,
    isAIConversation: PropTypes.bool,
  })).isRequired,
  setFetchedConversations: PropTypes.func.isRequired,
};

export default SettingsDialog;  
import React, { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { updateUser } from '../../../api/userService';
import { userShape } from "../../../model/userPropType";
import Tab from "./Tab";
import GeneralTab from "./GeneralTab";
import ContextTab from "./ContextTab";

import "./SettingsDialog.scss";

function SettingsDialog({ onClose, models, user, setUser }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("general");
  const modalContentRef = useRef(null);

  // Memoize handleClickOutside with useCallback
  const handleClickOutside = useCallback((event) => {
    if (modalContentRef.current && !modalContentRef.current.contains(event.target)) {
      onClose();
    }
  }, [onClose]); // Only re-create if onClose changes

  // Attach the event listener on mount and remove it on unmount
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  useEffect(() => {
  }, [user]);
  const contentMap = {
    general: <GeneralTab user={user} setUser={setUser} models={models} />,
    context: <ContextTab user={user} setUser={setUser} />,
  };

  // Function to handle close and save user data
  const handleClose = async () => {
    if (user?.userId) {
      await updateUser(user);
    }
    onClose();
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
              label={t("context_settings_title")}
              isActive={activeTab === "context"}
              onClick={() => setActiveTab("context")}
            />
          </div>
          <div className="tab-content">{contentMap[activeTab]}</div>
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
      name: PropTypes.string,
    })
  ).isRequired,
};

export default SettingsDialog;

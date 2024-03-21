import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { userShape } from "../../../model/userPropType";
import { modelShape } from "../../../model/modelPropType";
import i18n from "../../../i18n";
import "./GeneralTab.scss";

const GeneralTab = ({ user, setUser, models }) => {
  const { t } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(user.settings.language || 'en');
  const languageOptions = [
    { value: 'en', label: t('english_language_title') },
    { value: 'es', label: t('spanish_language_title') },
    { value: 'fr', label: t('french_language_title') },
    { value: 'de', label: t('german_language_title') },
    { value: 'hi', label: t('hindi_language_title') },
  ];

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setSelectedLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    setUser((prevUser) => ({
      ...prevUser,
      settings: { ...prevUser.settings, language: newLanguage },
    }));
  };

  const handleModelChange = (e) => {
    setUser((prevSettings) => ({
      ...prevSettings,
      settings: {
        ...prevSettings.settings,
        model: e.target.value,
      },
    }));
  };

  const handleTemperatureChange = (e) => {
    setUser((prevSettings) => ({
      ...prevSettings,
      settings: {
        ...prevSettings.settings,
        temperature: parseFloat(e.target.value),
      },
    }));
  };

  const handleMaxTokensChange = (e) => {
    setUser((prevSettings) => ({
      ...prevSettings,
      settings: {
        ...prevSettings.settings,
        maxTokens: parseInt(e.target.value, 10),
      },
    }));
  };

  const handleStreamResponseChange = (e) => {
    setUser((prevSettings) => ({
      ...prevSettings,
      settings: {
        ...prevSettings.settings,
        isStreamResponse: e.target.checked,
      },
    }));
  };

  const handleThemeChange = (e) => {
    setUser((prevSettings) => ({
      ...prevSettings,
      settings: {
        ...prevSettings.settings,
        theme: e.target.value,
      },
    }));
  };

  const options = models.map((model) => (
    <option key={model.name} value={model.name}>
      {model.name} {model.isSupportsVision ? `V` : ""}
    </option>
  ));

  return (
    <div className="general-tab">

      <label>
        {t('model_title')}:
        <select value={user.settings.model} onChange={handleModelChange}>
          {options}
        </select>
      </label>

      <div>
        {t('temperature_title')}: {user.settings.temperature}
        <input
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={user.settings.temperature}
          onChange={handleTemperatureChange}
        />
      </div>

      <div>
        {t('max_tokens_title')}: {user.settings.maxTokens}
        <input
          type="range"
          min="1"
          max="4000"
          step="1"
          value={user.settings.maxTokens}
          onChange={handleMaxTokensChange}
        />
      </div>

      <div>
        <label>
          {t('stream_response_title')}:
          <input
            type="checkbox"
            checked={user.settings.isStreamResponse || false}
            onChange={handleStreamResponseChange}
          />
        </label>
      </div>
      <div>
        <label>
          {t('language_title')}:
          <select value={selectedLanguage} onChange={handleLanguageChange}>
            {languageOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div>
        <label>
          {t('theme_title')}:
          <select value={user.settings.theme} onChange={handleThemeChange}>
            <option value="light">{t('light_theme_title')}</option>
            <option value="dark">{t('dark_theme_title')}</option>
          </select>
        </label>
      </div>
    </div>
  );
};

GeneralTab.propTypes = {
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
  models: PropTypes.arrayOf(modelShape).isRequired,
};

export default GeneralTab;
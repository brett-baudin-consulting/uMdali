import React from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { userShape } from "../../../model/userPropType";
import "./GeneralTab.scss";

const GeneralTab = ({ user, setUser, models, speechModels }) => {
  const { t } = useTranslation();

  const handleModelChange = (e) => {
    setUser((prevSettings) => ({
      ...prevSettings,
      settings: {
        ...prevSettings.settings,
        model: e.target.value,
      },
    }));
  };

  const handleSpeechModelChange = (e) => {
    setUser((prevSettings) => ({
      ...prevSettings,
      settings: {
        ...prevSettings.settings,
        speechModel: e.target.value, // Add or update speechModel in settings
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
      {model.name}
    </option>
  ));

  const speechOptions = speechModels.map((model) => ( // Create options for speechModels
    <option key={model.name} value={model.name}>
      {model.name}
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
      <label> {/* Add a new label and select for speech to text model */}
        {t('speech_to_text_model_title')}:
        <select value={user.settings.speechModel} onChange={handleSpeechModelChange}>
          {speechOptions}
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
  models: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
  speechModels: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default GeneralTab;
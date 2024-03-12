import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { userShape } from "../../../model/userPropType";
import "./SpeechTab.scss";

const SpeechTab = ({ user, setUser, speechToTextModels, textToSpeechModels }) => {
  useEffect(() => {
    console.log('textToSpeechModels: ', textToSpeechModels);
  }, [textToSpeechModels]);
  const { t } = useTranslation();

  useEffect(() => {
    console.log('user: ', user);
  }, [user]);

  const handleSpeechToTextModelChange = (e) => {
    setUser((prevSettings) => ({
      ...prevSettings,
      settings: {
        ...prevSettings.settings,
        speechToTextModel: e.target.value,
      },
    }));
  };

  const speechToTextOptions = speechToTextModels.map((model) => (
    <option key={model.name} value={model.name}>
      {model.vendor} / {model.name}
    </option>
  ));

  const handleTextToSpeechModelChange = (e) => {
    console.log('e.target.value: ', e.target.value);
    setUser((prevSettings) => ({
      ...prevSettings,
      settings: {
        ...prevSettings.settings,
        textToSpeechModel: e.target.value,
      },
    }));
  };

  const textToSpeechOptions = textToSpeechModels.map((model) => (
    <option key={model.name} value={model.id}>
      {model.vendor} / {model.name}
    </option>
  ));

  return (
    <div className="speech-tab">
      <label>
        {t('speech_to_text_model_title')}:
        <select value={user.settings.speechToTextModel} onChange={handleSpeechToTextModelChange}>
          {speechToTextOptions}
        </select>
      </label>
      <label>
        {t('text_to_speech_model_title')}:
        <select value={user.settings.textToSpeechModel} onChange={handleTextToSpeechModelChange}>
          {textToSpeechOptions}
        </select>
      </label>
    </div>
  );
};

SpeechTab.propTypes = {
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
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

export default SpeechTab;
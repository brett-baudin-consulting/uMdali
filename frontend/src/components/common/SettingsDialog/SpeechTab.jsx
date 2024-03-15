import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { userShape } from "../../../model/userPropType";
import "./SpeechTab.scss";

const SpeechTab = ({ user, setUser, speechToTextModels, textToSpeechModels }) => {
  useEffect(() => {
    console.log('textToSpeechModels: ', textToSpeechModels);
  }, [textToSpeechModels]);
  const { t } = useTranslation();
  const initialModel = textToSpeechModels.find(model => model.id === user.settings.textToSpeechModel.model_id);
  const initialVoices = initialModel && Array.isArray(initialModel.voices) 
    ? initialModel.voices
        .filter(voice => voice?.name)
        .sort((a, b) => a.name.localeCompare(b.name)) 
    : [];
      const [selectedModelVoices, setSelectedModelVoices] = useState(initialVoices);

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
    const selectedModel = textToSpeechModels.find(model => model.id === e.target.value);
    
    if (selectedModel && Array.isArray(selectedModel.voices)) {
      const sortedVoices = selectedModel.voices
        .filter(voice => voice?.name)
        .sort((a, b) => a.name.localeCompare(b.name));
      setSelectedModelVoices(sortedVoices);
    } else {
      setSelectedModelVoices([]);
    }
  
    setUser((prevSettings) => ({
      ...prevSettings,
      settings: {
        ...prevSettings.settings,
        textToSpeechModel: {
          ...prevSettings.settings.textToSpeechModel,
          model_id: e.target.value,
          vendor: selectedModel ? selectedModel.vendor : '',
        },
      },
    }));
  };

  const textToSpeechOptions = textToSpeechModels.map((model) => (
    <option key={model.name} value={model.id}>
      {model.vendor} / {model.name}
    </option>
  ));
  const voiceOptions = selectedModelVoices.map((voice) => (
    <option key={voice.id} value={voice.id}>
      {voice.name}
    </option>
  ));  
  const handleVoiceChange = (e) => {
    const selectedVoiceId = e.target.value;
    setUser((prevUser) => ({
      ...prevUser,
      settings: {
        ...prevUser.settings,
        textToSpeechModel: {
          ...prevUser.settings.textToSpeechModel,
          voice_id: selectedVoiceId,
        },
      },
    }));
  };
  useEffect(() => {
    console.log('voiceOptions: ', voiceOptions);
  }
  , [voiceOptions]);
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
        <select value={user.settings.textToSpeechModel.model_id} onChange={handleTextToSpeechModelChange}>
          {textToSpeechOptions}
        </select>
      </label>
      {selectedModelVoices.length > 0 && (
        <label>
          {t('voice_settings_title')}:
          <select
            value={user.settings.textToSpeechModel.voice_id || ''}
            onChange={handleVoiceChange}
          >
            {voiceOptions}
          </select>
        </label>
      )}
    </div>
  );
};

SpeechTab.propTypes = {
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
  speechToTextModels: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      voices: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
  textToSpeechModels: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default SpeechTab;
import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { userShape } from "../../../model/userPropType";
import "./SpeechTab.scss";

const SpeechTab = ({ user, setUser, speechToTextModels, textToSpeechModels }) => {
  const { t } = useTranslation();
  const [selectedModelVoices, setSelectedModelVoices] = useState([]);

  useEffect(() => {
    const initialModel = textToSpeechModels.find(
      (model) => model.id === user.settings.textToSpeechModel.model_id
    );
    const initialVoices = initialModel?.voices?.filter((voice) => voice?.name).sort((a, b) => a.name.localeCompare(b.name)) || [];
    setSelectedModelVoices(initialVoices);
  }, [user.settings.textToSpeechModel.model_id, textToSpeechModels]);

  const handleSpeechToTextModelChange = (e) => {
    setUser((prevUser) => ({
      ...prevUser,
      settings: {
        ...prevUser.settings,
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
    const selectedModel = textToSpeechModels.find((model) => model.id === e.target.value);

    if (selectedModel) {
      const sortedVoices = selectedModel.voices
        ?.filter((voice) => voice?.name)
        .sort((a, b) => a.name.localeCompare(b.name)) || [];
      setSelectedModelVoices(sortedVoices);

      // Check if the currently selected voice is in the new list of voices
      const currentVoiceId = user.settings.textToSpeechModel.voice_id;
      const defaultVoiceId = sortedVoices.length > 0 ? sortedVoices[0].id : '';
      const isCurrentVoiceInList = sortedVoices.some(voice => voice.id === currentVoiceId);

      setUser((prevUser) => ({
        ...prevUser,
        settings: {
          ...prevUser.settings,
          textToSpeechModel: {
            ...prevUser.settings.textToSpeechModel,
            model_id: e.target.value,
            voice_id: isCurrentVoiceInList ? currentVoiceId : defaultVoiceId, // Use default voice if current is not in list
            vendor: selectedModel.vendor,
          },
        },
      }));
    } else {
      setSelectedModelVoices([]);
    }
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
      vendor: PropTypes.string.isRequired,
    })
  ).isRequired,
  textToSpeechModels: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      vendor: PropTypes.string.isRequired,
      voices: PropTypes.arrayOf(
        PropTypes.shape({
          id: PropTypes.string.isRequired,
          name: PropTypes.string.isRequired,
        })
      ),
    })
  ).isRequired,
};

export default SpeechTab;
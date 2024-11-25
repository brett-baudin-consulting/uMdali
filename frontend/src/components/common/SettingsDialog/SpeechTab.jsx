import React, { useEffect, useState, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import { userShape } from "../../../model/userPropType";
import { textToSpeechModelShape } from "../../../model/textToSpeechModelPropType";
import { speechToTextModelShape } from "../../../model/speechToTextModelPropType";
import SelectField from "./SelectField";

import "./SpeechTab.scss";

const SpeechTab = ({ user, setUser, speechToTextModels, textToSpeechModels }) => {
  const { t } = useTranslation();
  const [selectedModelVoices, setSelectedModelVoices] = useState([]);

  const updateUserSettings = useCallback((newSettings) => {
    setUser((prevUser) => ({
      ...prevUser,
      settings: {
        ...prevUser.settings,
        ...newSettings,
      },
    }));
  }, [setUser]);

  useEffect(() => {
    const initialModel = textToSpeechModels.find(
      (model) => model.id === user.settings.textToSpeechModel.model_id
    );
    const initialVoices = initialModel?.voices
      ?.filter((voice) => voice?.name)
      .sort((a, b) => a.name.localeCompare(b.name)) || [];
    setSelectedModelVoices(initialVoices);
  }, [user.settings.textToSpeechModel.model_id, textToSpeechModels]);

  const speechToTextOptions = useMemo(() =>
    speechToTextModels.map((model) => (
      <option key={model.name} value={model.name}>
        {model.vendor} / {model.name}
      </option>
    )),
    [speechToTextModels]
  );

  const textToSpeechOptions = useMemo(() =>
    textToSpeechModels.map((model) => (
      <option key={model.name} value={model.id}>
        {model.vendor} / {model.name}
      </option>
    )),
    [textToSpeechModels]
  );

  const voiceOptions = useMemo(() =>
    selectedModelVoices.map((voice) => (
      <option key={voice.id} value={voice.id}>
        {voice.name}
      </option>
    )),
    [selectedModelVoices]
  );

  const handleSpeechToTextModelChange = useCallback((e) => {
    const selectedModel = speechToTextModels.find((model) => model.name === e.target.value);
    updateUserSettings({
      speechToTextModel: {
        model: selectedModel.name,
        vendor: selectedModel.vendor,
      },
    });
  }, [speechToTextModels, updateUserSettings]);

  const handleTextToSpeechModelChange = useCallback((e) => {
    const selectedModel = textToSpeechModels.find((model) => model.id === e.target.value);

    if (selectedModel) {
      const sortedVoices = selectedModel.voices
        ?.filter((voice) => voice?.name)
        .sort((a, b) => a.name.localeCompare(b.name)) || [];

      setSelectedModelVoices(sortedVoices);

      const currentVoiceId = user.settings.textToSpeechModel.voice_id;
      const defaultVoiceId = sortedVoices[0]?.id || '';
      const isCurrentVoiceInList = sortedVoices.some(voice => voice.id === currentVoiceId);

      updateUserSettings({
        textToSpeechModel: {
          ...user.settings.textToSpeechModel,
          model_id: e.target.value,
          voice_id: isCurrentVoiceInList ? currentVoiceId : defaultVoiceId,
          vendor: selectedModel.vendor,
        },
      });
    }
  }, [textToSpeechModels, user.settings.textToSpeechModel, updateUserSettings]);

  const handleVoiceChange = useCallback((e) => {
    updateUserSettings({
      textToSpeechModel: {
        ...user.settings.textToSpeechModel,
        voice_id: e.target.value,
      },
    });
  }, [user.settings.textToSpeechModel, updateUserSettings]);

  return (
    <div className="speech-tab">
      <SelectField
        label={t('speech_to_text_model_title')}
        value={user.settings.speechToTextModel.model}
        onChange={handleSpeechToTextModelChange}
        options={speechToTextOptions}
      />
      <SelectField
        label={t('text_to_speech_model_title')}
        value={user.settings.textToSpeechModel.model_id}
        onChange={handleTextToSpeechModelChange}
        options={textToSpeechOptions}
      />
      {selectedModelVoices.length > 0 && (
        <SelectField
          label={t('voice_settings_title')}
          value={user.settings.textToSpeechModel.voice_id || ''}
          onChange={handleVoiceChange}
          options={voiceOptions}
        />
      )}
    </div>
  );
};

SelectField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.node.isRequired,
};

SpeechTab.propTypes = {
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
  speechToTextModels: PropTypes.arrayOf(speechToTextModelShape).isRequired,
  textToSpeechModels: PropTypes.arrayOf(textToSpeechModelShape).isRequired,
};

export default SpeechTab;  
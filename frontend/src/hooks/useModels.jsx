import { useState, useEffect } from 'react';
import { fetchModels } from '../api/modelService';
import { fetchSpeechToTextModels } from '../api/speechToTextModelService';
import { fetchTextToSpeechModels } from '../api/textToSpeechModelService';
import { fetchDataImportModels } from '../api/dataImportModelService';

export const useLoadModels = (isLoggedIn) => {
  const [models, setModels] = useState([]);
  const [speechToTextModels, setSpeechToTextModels] = useState([]);
  const [textToSpeechModels, setTextToSpeechModels] = useState([]);
  const [dataImportModels, setDataImportModels] = useState([]);
  const [error, setError] = useState(null);

  const getModel = (user, currentConversation, setUser) => {
    let modelName = user.settings.model;
    if (currentConversation.isAIConversation) {
      modelName = currentConversation.messages.length % 2 === 0
        ? currentConversation.model2
        : currentConversation.model1;
    }

    let model;
    if (modelName.indexOf('/') === -1) {
      modelName = user.settings.model;
      model = models.find((model) => model.name === modelName)
      setUser((prevUser) => ({
        ...prevUser,
        settings: {
          ...prevUser.settings,
          model: model.vendor + '/' + model.name,
        },
      }));
    }
    else {
      const [vendor, name] = modelName.split('/');
      model = models.find((model) => model.vendor === vendor && model.name === name);
    }

    if (!model) {
      model = models.find((model) => model.name === 'gpt-4-turbo');
    }
    return model;
  };

  useEffect(() => {
    const loadModels = async () => {
      try {
        setError(null);
        const [
          modelsData,
          speechToTextModelsData,
          textToSpeechModelsData,
          dataImportModelsData
        ] = await Promise.all([
          fetchModels(),
          fetchSpeechToTextModels(),
          fetchTextToSpeechModels(),
          fetchDataImportModels()
        ]);

        setModels(modelsData);
        setSpeechToTextModels(speechToTextModelsData);
        setTextToSpeechModels(textToSpeechModelsData);
        setDataImportModels(dataImportModelsData);
      } catch (error) {
        setError(error.message);
      }
    };

    if (isLoggedIn) {
      loadModels();
    }
  }, [isLoggedIn]);

  return {
    models,
    speechToTextModels,
    textToSpeechModels,
    dataImportModels,
    error,
    getModel,
  };
};  

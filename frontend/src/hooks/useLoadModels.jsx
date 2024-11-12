import { useState, useEffect } from 'react';  
import { fetchModels } from '../api/modelService';  
import { fetchSpeechToTextModels } from '../api/speechToTextModelService';  
import { fetchTextToSpeechModels } from '../api/textToSpeechModelService';  
import { fetchDataImportModels } from '../api/dataImportModelService';
import { useTranslation } from "react-i18next";

export const useLoadModels = (isLoggedIn) => {  
  const [models, setModels] = useState([]);  
  const [speechToTextModels, setSpeechToTextModels] = useState([]);  
  const [textToSpeechModels, setTextToSpeechModels] = useState([]);  
  const [dataImportModels, setDataImportModels] = useState([]);  
  const [error, setError] = useState(null);
    const { t } = useTranslation();

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
    error  
  };  
};  
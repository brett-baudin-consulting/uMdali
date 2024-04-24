import React, { useState } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import ReadonlyCheckbox from "./ReadonlyCheckbox";

import { userShape } from "../../../model/userPropType";
import { modelShape } from "../../../model/modelPropType";

import "./ModelTab.scss";

const ModelTab = ({ user, setUser, models }) => {
    const { t } = useTranslation();
    const [vendor, name] = user.settings.model.split('/');
    const initialModel = models.find((model) => model.vendor === vendor && model.name === name);
    const [currentModel, setCurrentModel] = useState(initialModel);

    const sortedModels = [...models].sort((a, b) => {
        const vendorNameA = `${a.vendor}/${a.name}`.toLowerCase();
        const vendorNameB = `${b.vendor}/${b.name}`.toLowerCase();
        return vendorNameA.localeCompare(vendorNameB);
    });

    const handleModelChange = (e) => {
        const [vendor, name] = e.target.value.split('/');
        const newModel = models.find((model) => model.vendor === vendor && model.name === name);
        setUser(prevUser => ({
            ...prevUser,
            settings: {
                ...prevUser.settings,
                model: `${newModel.vendor}/${newModel.name}`,
                maxTokens: newModel.outputTokenLimit,
            },
        }));
        setCurrentModel(newModel);
    };

    const handleTemperatureChange = (e) => {
        const newTemperature = parseFloat(e.target.value);
        setUser(prevUser => ({
            ...prevUser,
            settings: {
                ...prevUser.settings,
                temperature: newTemperature,
            },
        }));
    };

    const handleMaxTokensChange = (e) => {
        const newMaxTokens = parseInt(e.target.value, 10);
        setUser(prevUser => ({
            ...prevUser,
            settings: {
                ...prevUser.settings,
                maxTokens: newMaxTokens,
            },
        }));
    };

    const handleStreamResponseChange = (e) => {
        const newIsStreamResponse = e.target.checked;
        setUser(prevUser => ({
            ...prevUser,
            settings: {
                ...prevUser.settings,
                isStreamResponse: newIsStreamResponse,
            },
        }));
    };

    const options = sortedModels.map((model) => (
        <option key={`${model.vendor}/${model.name}`} value={`${model.vendor}/${model.name}`}>
            {`${model.vendor}/${model.name}`} ({model.isSupportsVision ? 'I' : ''} {model.isSupportsAudio ? 'A' : ''} {model.isSupportsVideo ? 'V' : ''} {model.isSupportsContext ? 'C' : ''})
        </option>
    ));

    return (
        <div className="model-tab">
            <label>
                {t('model_title')}:
                <select value={user.settings.model} onChange={handleModelChange}>
                    {options}
                </select>
            </label>
            <div className="readonly-checkbox-container">
                <ReadonlyCheckbox isChecked={currentModel?.isSupportsVision} label={t('vision_support_title')} />
                <ReadonlyCheckbox isChecked={currentModel?.isSupportsAudio} label={t('audio_support_title')} />
                <ReadonlyCheckbox isChecked={currentModel?.isSupportsVideo} label={t('video_support_title')} />
                <ReadonlyCheckbox isChecked={currentModel?.isSupportsContext} label={t('context_support_title')} />
            </div>
            <div className="div">
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
                    max={currentModel ? currentModel.outputTokenLimit : 1024}
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
        </div>
    );
};

ModelTab.propTypes = {
    user: userShape.isRequired,
    setUser: PropTypes.func.isRequired,
    models: PropTypes.arrayOf(modelShape).isRequired,
};

export default ModelTab;
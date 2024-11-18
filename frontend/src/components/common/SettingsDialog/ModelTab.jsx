import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import ReadonlyCheckbox from "./ReadonlyCheckbox";
import { userShape } from "../../../model/userPropType";
import { modelShape } from "../../../model/modelPropType";
import "./ModelTab.scss";

const ModelTab = ({ user, setUser, models }) => {
    const { t } = useTranslation();
    const [vendor, name] = user.settings.model.split('/');

    const currentModel = useMemo(() =>
        models.find((model) => model.vendor === vendor && model.name === name),
        [models, vendor, name]
    );

    const sortedModels = useMemo(() =>
        [...models].sort((a, b) =>
            `${a.vendor}/${a.name}`.toLowerCase()
                .localeCompare(`${b.vendor}/${b.name}`.toLowerCase())
        ),
        [models]
    );

    const handleModelChange = (e) => {
        const [newVendor, newName] = e.target.value.split('/');
        const newModel = models.find((model) =>
            model.vendor === newVendor && model.name === newName
        );

        setUser(prevUser => ({
            ...prevUser,
            settings: {
                ...prevUser.settings,
                model: `${newModel.vendor}/${newModel.name}`,
                maxTokens: newModel.outputTokenLimit,
                isStreamResponse: newModel.isSupportsStreaming,
            },
        }));
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

    return (
        <div className="model-tab">
            <div className="form-group">
                <label htmlFor="model-select">{t('model_title')}:</label>
                <select
                    id="model-select"
                    value={user.settings.model}
                    onChange={handleModelChange}
                >
                    {sortedModels.map((model) => (
                        <option
                            key={`${model.vendor}/${model.name}`}
                            value={`${model.vendor}/${model.name}`}
                        >
                            {`${model.vendor}/${model.name}`}
                            {model.isSupportsVision ? 'I ' : ''}
                            {model.isSupportsAudio ? 'A ' : ''}
                            {model.isSupportsVideo ? 'V ' : ''}
                            {model.isSupportsContext ? 'C ' : ''}
                            {model.isSupportsStreaming ? 'S' : ''}
                        </option>
                    ))}
                </select>
            </div>

            <div className="readonly-checkbox-container">
                <ReadonlyCheckbox
                    isChecked={currentModel?.isSupportsVision}
                    label={t('vision_support_title')}
                />
                <ReadonlyCheckbox
                    isChecked={currentModel?.isSupportsAudio}
                    label={t('audio_support_title')}
                />
                <ReadonlyCheckbox
                    isChecked={currentModel?.isSupportsVideo}
                    label={t('video_support_title')}
                />
                <ReadonlyCheckbox
                    isChecked={currentModel?.isSupportsContext}
                    label={t('context_support_title')}
                />
                <ReadonlyCheckbox
                    isChecked={currentModel?.isSupportsStreaming}
                    label={t('streaming_support_title')}
                />
            </div>

            <div className="form-group range-group">
                <label htmlFor="temperature-range">
                    {t('temperature_title')}: {user.settings.temperature}
                </label>
                <div className="range-container">
                    <input
                        id="temperature-range"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={user.settings.temperature}
                        onChange={handleTemperatureChange}
                    />
                </div>
            </div>

            <div className="form-group range-group">
                <label htmlFor="max-tokens-range">
                    {t('max_tokens_title')}: {user.settings.maxTokens}
                </label>
                <div className="range-container">
                    <input
                        id="max-tokens-range"
                        type="range"
                        min="1"
                        max={currentModel?.outputTokenLimit || 1024}
                        step="1"
                        value={user.settings.maxTokens}
                        onChange={handleMaxTokensChange}
                    />
                </div>
            </div>

            <div className="form-group">
                <label htmlFor="stream-response-checkbox">
                    {t('stream_response_title')}:
                </label>
                <input
                    id="stream-response-checkbox"
                    type="checkbox"
                    checked={user.settings.isStreamResponse || false}
                    onChange={handleStreamResponseChange}
                    disabled={!currentModel?.isSupportsStreaming}
                />
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
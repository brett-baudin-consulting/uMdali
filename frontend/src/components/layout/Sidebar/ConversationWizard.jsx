import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from "react-i18next";
import moment from 'moment';


import { userShape } from '../../../model/userPropType';
import { modelShape } from '../../../model/modelPropType';
import { textToSpeechModelShape } from '../../../model/textToSpeechModelPropType';
import { postConversation } from '../../../api/conversationService';

import './ConversationWizard.scss';

const ErrorMessage = ({ error }) => {
    return error ? <div className="errorMessage">This field is required.</div> : null;
};

export const ConversationWizard = ({
    user,
    onClose,
    setCurrentConversation,
    setConversations,
    onSendMessage,
    models,
    textToSpeechModels,
}) => {
    const { t } = useTranslation();
    const sortedContexts = useMemo(() => {
        return [...user.settings.contexts].sort((a, b) => a.name.localeCompare(b.name));
    }, [user.settings.contexts]);

    const initialContextId = sortedContexts.length > 0 ? sortedContexts[0].contextId : '';

    const [selectedContext1, setSelectedContext1] = useState(initialContextId);
    const [selectedContext2, setSelectedContext2] = useState(initialContextId);
    const [alias1, setAlias1] = useState('');
    const [alias2, setAlias2] = useState('');
    const [voice1, setVoice1] = useState(user.settings.textToSpeechModel.voices_id);
    const [voice2, setVoice2] = useState(user.settings.textToSpeechModel.voices_id);
    const [conversationStarter, setConversationStarter] = useState('');
    const [errors, setErrors] = useState({
        alias1: false,
        alias2: false,
        conversationStarter: false,
    });
    const sortedModels = useMemo(() => {
        return [...models].sort((a, b) => (a.vendor + a.name).localeCompare(b.vendor + b.name));
    }, [models]);

    const voicesMap = useMemo(() => {  
        const textToSpeechModel = textToSpeechModels.find(model => model.id === user.settings.textToSpeechModel.model_id);  
        if (!textToSpeechModel || !textToSpeechModel.voices) return [];  
        return [...textToSpeechModel.voices].sort((a, b) => a.name.localeCompare(b.name));   
    }, [textToSpeechModels, user.settings.textToSpeechModel.model_id]);  

    const initialModelId = sortedModels.length > 0 ? `${sortedModels[0].vendor}/${sortedModels[0].name}` : '';

    const [selectedModel1, setSelectedModel1] = useState(initialModelId);
    const [selectedModel2, setSelectedModel2] = useState(initialModelId);

    const validateForm = () => {
        const newErrors = {
            alias1: !alias1.trim(),
            alias2: !alias2.trim(),
            conversationStarter: !conversationStarter.trim(),
        };
        setErrors(newErrors);

        const isValid = !newErrors.alias1 && !newErrors.alias2 && !newErrors.conversationStarter;
        return isValid;
    };

    const handleOkClick = async () => {
        const isValid = validateForm();
        if (!isValid) return;
        const context1Message = {
            role: "context",
            content: findContextText(selectedContext1),
            messageId: uuidv4(),
            alias: alias1 + ' (Context)',
            modelName: selectedModel1,
        };
        const newConversation = {
            title: moment().format(t("title_date_format")),
            conversationId: uuidv4(),
            userId: user.userId,
            model1: selectedModel1,
            model2: selectedModel2,
            contextId1: selectedContext1,
            contextId2: selectedContext2,
            alias1: alias1,
            alias2: alias2,
            voice1: voice1,
            voice2: voice2,
            textToSpeechModelId: user.settings.textToSpeechModel.model_id,
            textToSpeechVendor: user.settings.textToSpeechModel.vendor,
            isAIConversation: true,
            messages: [context1Message],
        }
        try {
            await postConversation(newConversation);
            setCurrentConversation(newConversation);
            setConversations((prev) => [...prev, newConversation]);
            onSendMessage(conversationStarter.trim(), [], selectedModel1, alias1, alias2);
        } catch (error) {
            console.error('Failed to post conversation:', error);
        } finally {
            onClose();
        }
    };

    const findContextText = useCallback((contextId) => {
        const context = user.settings.contexts.find(c => c.contextId === contextId);
        return context ? context.text : '';
    }, [user.settings.contexts]);

    return (
        <div className="conversationWizard">
            <div className="selectContainer">
                <div>
                    <div>{t('ai1')} {t('ai1_title')}</div>
                    <input
                        type="text"
                        placeholder={t('ai1_alias_placeholder')}
                        value={alias1}
                        onChange={(e) => setAlias1(e.target.value)}
                        className={`inputField ${errors.alias1 ? 'error' : ''}`}
                    />
                    <ErrorMessage error={errors.alias1} />
                    <label htmlFor='modelSelection1'>{t('model_title')}</label>
                    <select value={selectedModel1} onChange={(e) => setSelectedModel1(e.target.value)}>
                        {sortedModels.map((model) => (
                            <option key={model.name} value={`${model.vendor}/${model.name}`}>
                                {model.vendor}/{model.name}
                            </option>
                        ))}
                    </select>
                    <label htmlFor='voiceSelection1'>{t('voice_title')}</label>
                    <select value={voice1} onChange={(e) => setVoice1(e.target.value)}>
                        {voicesMap.map((voice) => (  
                            <option key={voice.id} value={voice.id}>
                                {voice.name}
                            </option>
                        ))}
                    </select>
                    <label htmlFor='contextSelection1'>{t('context_title')}</label>
                    <select value={selectedContext1} onChange={(e) => setSelectedContext1(e.target.value)}>
                        {sortedContexts.map((context) => (
                            <option key={context.contextId} value={context.contextId}>
                                {context.name}
                            </option>
                        ))}
                    </select>
                    <textarea
                        className="contextText"
                        readOnly
                        value={findContextText(selectedContext1)}
                    />
                </div>
                <div>
                    <div>{t('ai2')} {t('ai2_title')}</div>
                    <input
                        type="text"
                        placeholder={t('ai2_alias_placeholder')}
                        value={alias2}
                        onChange={(e) => setAlias2(e.target.value)}
                        className={`inputField ${errors.alias2 ? 'error' : ''}`}
                    />
                    <ErrorMessage error={errors.alias2} />
                    <label htmlFor='modelSelection2'>{t('model_title')}</label>
                    <select value={selectedModel2} onChange={(e) => setSelectedModel2(e.target.value)}>
                        {sortedModels.map((model) => (
                            <option key={model.name} value={`${model.vendor}/${model.name}`}>
                                {model.vendor}/{model.name}
                            </option>
                        ))}
                    </select>
                    <label htmlFor='voiceSelection2'>{t('voice_title')}</label>
                    <select value={voice2} onChange={(e) => setVoice2(e.target.value)}>
                        {voicesMap.map((voice) => (  
                            <option key={voice.id} value={voice.id}>
                                {voice.name}
                            </option>
                        ))}
                    </select>
                    <label htmlFor='contextSelection2'>{t('context_title')}</label>
                    <select value={selectedContext2} onChange={(e) => setSelectedContext2(e.target.value)}>
                        {sortedContexts.map((context) => (
                            <option key={context.contextId} value={context.contextId}>
                                {context.name}
                            </option>
                        ))}
                    </select>

                    <textarea
                        className="contextText"
                        readOnly
                        value={findContextText(selectedContext2)}
                    />
                </div>
            </div>
            <textarea
                className={`conversationStarter ${errors.conversationStarter ? 'error' : ''}`}
                value={conversationStarter}
                onChange={(e) => setConversationStarter(e.target.value)}
                placeholder={t('conversation_starter_placeholder')}
            />
            {errors.conversationStarter &&
                <ErrorMessage error={errors.conversationStarter} />
            }
            <div className="buttonsContainer">
                <button onClick={handleOkClick}>
                    {t('ok_title')}
                </button>
                <button onClick={() => { onClose(); }}>{t('cancel_title')}</button>
            </div>
        </div>
    );
};

ErrorMessage.propTypes = {
    error: PropTypes.bool,
};

ConversationWizard.propTypes = {
    user: userShape.isRequired,
    onClose: PropTypes.func.isRequired,
    setCurrentConversation: PropTypes.func.isRequired,
    setConversations: PropTypes.func.isRequired,
    onSendMessage: PropTypes.func.isRequired,
    models: PropTypes.arrayOf(modelShape).isRequired,
    textToSpeechModels: PropTypes.arrayOf(textToSpeechModelShape).isRequired,
};
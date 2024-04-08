import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

import { conversationShape } from "../../../../model/conversationPropType";
import { userShape } from "../../../../model/userPropType";

import "./ConversationFooter.scss";

const AIConversationFooter = ({ user, currentConversation, setCurrentConversation,
    onResendMessage, isStreaming, setIsStreaming, abortFetch,
    isWaitingForResponse }) => {
    const { t } = useTranslation();

    let context1 = '';
    let context2 = '';
    context1 = user.settings.contexts.filter(
        context => context.contextId === currentConversation.contextId1)[0].text;
    context2 = user.settings.contexts.filter(
        context => context.contextId === currentConversation.contextId2)[0].text;



    const handleAbort = useCallback(() => {
        setIsStreaming(false);
        abortFetch();
    }, [setIsStreaming, abortFetch]);

    const handleRetry = useCallback(async () => {
        const newMessages = [...currentConversation.messages.slice(0, -1)];
        setCurrentConversation(prevState => ({ ...prevState, messages: newMessages }));
        const alias = currentConversation.messages.length % 2 === 0 ? currentConversation.alias2 : currentConversation.alias1;
        const model = currentConversation.messages.length % 2 === 0 ? currentConversation.model2 : currentConversation.model1;
        await onResendMessage(model, alias);
    }, [currentConversation, setCurrentConversation, onResendMessage]);

    const turn = useCallback(async () => {
        const model = currentConversation.messages.length % 2 === 0 ? currentConversation.model1 : currentConversation.model2;
        const alias = currentConversation.messages.length % 2 === 0 ? currentConversation.alias1 : currentConversation.alias2;
        const contextMessageA = {
            messageId: uuidv4(),
            content: context1,
            role: "context",
            alias: currentConversation.alias1,
            modelName: currentConversation.model1
        };
        const contextMessageB = {
            messageId: uuidv4(),
            content: context2,
            role: "context",
            alias: currentConversation.alias2,
            modelName: currentConversation.model2
        };
        const contextMessage = currentConversation.messages.length % 2 === 0 ? contextMessageA : contextMessageB;
        // remove context messages
        let filteredMessages = currentConversation.messages
            .filter(message => message.role !== 'context');
        // remove the first message if the number of messages is even and save it as humanMessage
        let humanMessage = null;
        if (filteredMessages.length % 2 === 0) {
            humanMessage = filteredMessages[0];
            filteredMessages = filteredMessages.slice(1);
        }
        // flip the roles of the messages
        filteredMessages = filteredMessages
            .map((message, index) => {
                let role = index % 2 === 0 ? 'user' : 'bot';
                return {
                    ...message,
                    role,
                };
            });
        // add the context message to the beginning of the messages
        filteredMessages = [contextMessage, ...filteredMessages];
        // update the conversation with the new messages
        setCurrentConversation((prevConversation) => ({
            ...prevConversation,
            messages: filteredMessages,
        }));
        await onResendMessage(model, alias);
        // add the human message back to the conversation
        if (humanMessage) {
            setCurrentConversation((prevConversation) => {
                const updatedMessages = [...prevConversation.messages];
                updatedMessages.splice(1, 0, humanMessage); // Insert humanMessage at index 1
                return {
                    ...prevConversation,
                    messages: updatedMessages,
                };
            });
        }
    }, [currentConversation, setCurrentConversation, onResendMessage, context1, context2]);

    return (
        <div className="conversation-footer">
            <div className="top-footer-menu">
                {(isStreaming || isWaitingForResponse) && (
                    <button title={t("abort_title")} onClick={handleAbort}>{t("abort")}</button>
                )}
                {!isStreaming && (
                    <button title={t("retry_title")} onClick={handleRetry}>
                        {t("retry")}
                    </button>
                )}
                <button onClick={turn} title={t('continue_title')}>
                    {t("continue")}
                </button>
            </div>
        </div>
    );
};

AIConversationFooter.propTypes = {
    user: userShape.isRequired,
    currentConversation: PropTypes.shape(conversationShape),
    setCurrentConversation: PropTypes.func.isRequired,
    onResendMessage: PropTypes.func.isRequired,
    isStreaming: PropTypes.bool.isRequired,
    setIsStreaming: PropTypes.func.isRequired,
    abortFetch: PropTypes.func.isRequired,
    isWaitingForResponse: PropTypes.bool.isRequired,
};

export default AIConversationFooter;
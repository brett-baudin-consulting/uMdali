// ConversationFooter.jsx    
import { useState, useEffect, useCallback, useRef } from "react";
import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";
import hljs from 'highlight.js';

import { deleteFile } from "../../../../api/fileService";
import FileItem from './FileItem';
import { conversationShape } from "../../../../model/conversationPropType";
import { userShape } from "../../../../model/userPropType";
import { handleKeyDown as handleKeyDownUtility } from "../../../common/util/useTextareaKeyHandlers";
import { modelShape } from "../../../../model/modelPropType";
import AudioRecorder from "./AudioRecorder";
import { useTextArea } from "./hooks/useTextArea";
import { useFileUpload } from "./hooks/useFileUpload";
import SendButton from "./components/SendButton";
import FileUploadButton from "./components/FileUploadButton";
import ErrorBoundary from "./components/ErrorBoundary";

import "./ConversationFooter.scss";

const BOT_ROLE = "bot";

const ConversationFooter = ({
  user,
  currentConversation,
  setCurrentConversation,
  onSendMessage,
  onResendMessage,
  isStreaming,
  setIsStreaming,
  abortFetch,
  isWaitingForResponse,
  setError,
  models
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef(null);
  const [lastMessageRole, setLastMessageRole] = useState(null);

  const {
    value: input,
    setValue: setInput,
    textareaRef,
    isExpanded,
    setIsExpanded,
    toggleExpand
  } = useTextArea("");

  const {
    fileList,
    setFileList,
    handleUpload,
    isUploading
  } = useFileUpload(currentConversation?.userId, setError);

  useEffect(() => {
    setError(null);
  }, [setError]);

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming]);

  useEffect(() => {
    if (currentConversation?.messages?.length > 0) {
      setLastMessageRole(currentConversation.messages[currentConversation.messages.length - 1].role);
    }
  }, [currentConversation?.messages]);

  const handleSend = useCallback(async () => {
    if (!currentConversation) return;

    const trimmedInput = input.trim();
    if (trimmedInput || fileList.length > 0) {
      try {
        await onSendMessage(trimmedInput, fileList, user.settings.model);
        textareaRef.current?.focus();
        setInput("");
        setFileList([]);
        setIsExpanded(false);
      } catch (error) {
        setError(error);
        console.error('Failed to send message:', error);
      }
    }
  }, [currentConversation, input, fileList, onSendMessage, user.settings.model, setInput, setFileList, toggleExpand, setError]);

  const handleAbort = useCallback(() => {
    setIsStreaming(false);
    abortFetch();
    textareaRef.current?.focus();
  }, [setIsStreaming, abortFetch]);

  const handleRetry = useCallback(async () => {
    const newMessages = [...currentConversation.messages.slice(0, -1)];
    setCurrentConversation(prevState => ({ ...prevState, messages: newMessages }));
    await onResendMessage(user.settings.model);
    textareaRef.current?.focus();
  }, [currentConversation, setCurrentConversation, onResendMessage, user.settings.model]);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const detectedLanguage = hljs.highlightAuto(clipboardText);
      const language = detectedLanguage.language || 'plaintext';
      const formattedText = `\n\`\`\`${language}\n${clipboardText}\n\`\`\`\n`;

      const cursorPosition = textareaRef.current.selectionStart;
      const textBeforeCursor = input.substring(0, cursorPosition);
      const textAfterCursor = input.substring(cursorPosition);

      setInput(textBeforeCursor + formattedText + textAfterCursor);

      requestAnimationFrame(() => {
        const newPosition = (textBeforeCursor + formattedText).length;
        textareaRef.current?.setSelectionRange(newPosition, newPosition);
        textareaRef.current?.scrollTo(0, textareaRef.current.scrollHeight);
      });
    } catch (err) {
      setError(err);
      console.error('Failed to read clipboard:', err);
    }
  }, [input, setInput, setError]);

  const handleDeleteFile = useCallback((fileToDelete) => {
    if (!currentConversation?.userId) return;

    deleteFile(currentConversation.userId, fileToDelete.name);
    setFileList(prev => prev.filter(file => file.name !== fileToDelete.name));
    textareaRef.current?.focus();
  }, [currentConversation?.userId, setFileList]);

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    await handleUpload(file);
    event.target.value = '';
  }, [handleUpload]);

  const handleKeyDown = useCallback((e) => {
    handleKeyDownUtility(e, setInput, input, textareaRef, user.settings.macros);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [input, user.settings.macros, handleSend, setInput]);

  const doesModelSupportFiles = useCallback((models, modelName) => {
    const [vendor, name] = modelName.split('/');
    const model = models.find((m) => m.vendor === vendor && m.name === name);
    return model ? (model.isSupportsVision || model.isSupportsAudio || model.isSupportsVideo) : false;
  }, []);

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <ErrorBoundary>
      <div className="conversation-footer">
        <div className="conversation-footer__top-menu">
          {(isStreaming || isWaitingForResponse) && (
            <button title={t("abort_title")} onClick={handleAbort}>
              {t("abort")}
            </button>
          )}
          {!isStreaming && lastMessageRole === BOT_ROLE && (
            <button title={t("retry_title")} onClick={handleRetry}>
              {t("retry")}
            </button>
          )}
        </div>

        <div className="conversation-footer__file-list">
          {fileList.map((file) => (
            <FileItem
              key={file.name}
              file={file}
              onDelete={handleDeleteFile}
              currentConversation={currentConversation}
            />
          ))}
        </div>

        <div className="conversation-footer__input-container">
          <FileUploadButton
            disabled={isStreaming || isWaitingForResponse || !doesModelSupportFiles(models, user?.settings?.model)}
            onClick={handleFileButtonClick}
          />

          <textarea
            ref={textareaRef}
            className={`conversation-footer__textarea ${isExpanded ? 'conversation-footer__textarea--expanded' : ''}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("type_a_message")}
            disabled={isStreaming || isWaitingForResponse}
          />

          <SendButton
            disabled={!input.trim() && fileList.length === 0}
            isStreaming={isStreaming}
            isWaitingForResponse={isWaitingForResponse}
            onClick={handleSend}
          />

          <button
            title={t("paste_title")}
            onClick={handlePaste}
            disabled={isStreaming}
          >
            {t("paste")}
          </button>

          <button
            onClick={toggleExpand}
            title={t("toggle_height_title")}
          >
            {isExpanded ? t("shrink") : t("expand")}
          </button>

          <AudioRecorder
            isStreaming={isStreaming}
            setInput={setInput}
            setError={setError}
          />

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isStreaming}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </ErrorBoundary>
  );
};

ConversationFooter.propTypes = {
  user: userShape.isRequired,
  currentConversation: conversationShape,
  setCurrentConversation: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onResendMessage: PropTypes.func.isRequired,
  isStreaming: PropTypes.bool,
  setIsStreaming: PropTypes.func.isRequired,
  abortFetch: PropTypes.func.isRequired,
  isWaitingForResponse: PropTypes.bool,
  setError: PropTypes.func.isRequired,
  models: PropTypes.arrayOf(modelShape).isRequired,
};

ConversationFooter.defaultProps = {
  isStreaming: false,
  isWaitingForResponse: false,
  currentConversation: null
};

export default ConversationFooter;    
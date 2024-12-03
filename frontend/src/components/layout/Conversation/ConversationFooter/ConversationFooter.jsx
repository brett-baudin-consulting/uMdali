import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import PropTypes from "prop-types";
import hljs from 'highlight.js';

import FileItem from './FileItem';
import { conversationShape } from "../../../../model/conversationPropType";
import { userShape } from "../../../../model/userPropType";
import { handleKeyDown as handleKeyDownUtility } from "../../../common/util/useTextareaKeyHandlers";
import { modelShape } from "../../../../model/modelPropType";
import AudioRecorder from "./AudioRecorder";
import { useTextArea } from "./hooks/useTextArea";
import { useFileUpload } from "./hooks/useFileUpload";
import { useFileHandling } from "./hooks/useFileHandling";
import SendButton from "./components/SendButton";
import FileUploadButton from "./components/FileUploadButton";
import ErrorBoundary from "./components/ErrorBoundary";

import "./ConversationFooter.scss";

const BOT_ROLE = "bot";

const ConversationFooter = ({
  user,
  currentConversation = null,
  setCurrentConversation,
  onSendMessage,
  onResendMessage,
  isStreaming = false,
  setIsStreaming,
  abortFetch,
  isWaitingForResponse = false,
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
    handleUpload
  } = useFileUpload(currentConversation?.userId, setError);

  const {
    handleDeleteFile,
    handleFileChange,
    handleDrop,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    isDragging
  } = useFileHandling(
    currentConversation,
    setError,
    handleUpload,
    setFileList
  );

  useEffect(() => {
    setError(null);
  }, [setError]);

  useEffect(() => {
    if (!isStreaming) {
      textareaRef.current?.focus();
    }
  }, [isStreaming, textareaRef]);

  useEffect(() => {
    if (currentConversation?.messages?.length > 0) {
      setLastMessageRole(currentConversation.messages.slice(-1)[0].role);
    }
  }, [currentConversation?.messages]);

  const handleSend = useCallback(async () => {
    if (!currentConversation) return;

    const trimmedInput = input.trim();
    if (trimmedInput || fileList.length > 0) {
      try {
        await onSendMessage(trimmedInput, fileList, user.settings.model);
        setInput("");
        setFileList([]);
        setIsExpanded(false);
        textareaRef.current?.focus();
      } catch (error) {
        setError(error);
        console.error('Failed to send message:', error);
      }
    }
  }, [currentConversation, input, fileList, onSendMessage, user.settings.model, setInput, setFileList, setIsExpanded, setError, textareaRef]);

  const handleAbort = useCallback(() => {
    abortFetch();
    setIsStreaming(false);
    textareaRef.current?.focus();
  }, [abortFetch, setIsStreaming, textareaRef]);

  const handleRetry = useCallback(async () => {
    if (!currentConversation) return;
    const newMessages = currentConversation.messages.slice(0, -1);
    setCurrentConversation(prevState => ({ ...prevState, messages: newMessages }));
    try {
      await onResendMessage(user.settings.model);
      textareaRef.current?.focus();
    } catch (error) {
      setError(error);
      console.error("Failed to resend message:", error);
    }
  }, [currentConversation, setCurrentConversation, onResendMessage, user.settings.model, setError, textareaRef]);

  const handlePaste = useCallback(async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      const detectedLanguage = hljs.highlightAuto(clipboardText);
      const language = detectedLanguage.language || 'plaintext';
      const formattedText = `\n\`\`\`${language}\n${clipboardText}\n\`\`\`\n`;
      setInput(prevInput => {
        const cursorPosition = textareaRef.current.selectionStart;
        const textBeforeCursor = prevInput.substring(0, cursorPosition);
        const textAfterCursor = prevInput.substring(cursorPosition);
        const newText = textBeforeCursor + formattedText + textAfterCursor;

        requestAnimationFrame(() => {
          const newPosition = (textBeforeCursor + formattedText).length;
          textareaRef.current?.setSelectionRange(newPosition, newPosition);
        });
        return newText;
      });
    } catch (err) {
      setError(err);
      console.error('Failed to read clipboard:', err);
    }
  }, [setInput, setError, textareaRef]);

  const handleKeyDown = useCallback((e) => {
    handleKeyDownUtility(e, setInput, input, textareaRef, user.settings.macros);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [input, user.settings.macros, handleSend, setInput, textareaRef]);

  const doesModelSupportFiles = useCallback((models, modelName) => {
    const [vendor, name] = modelName.split('/');
    const model = models.find((m) => m.vendor === vendor && m.name === name);
    return model ? (model.isSupportsVision || model.isSupportsAudio || model.isSupportsVideo) : false;
  }, []);

  const handleFileButtonClick = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const isDisabled = isStreaming || isWaitingForResponse || !doesModelSupportFiles(models, user?.settings?.model);

  return (
    <ErrorBoundary>
      <div
        className={`  
          conversation-footer  
          ${isDragging ? 'conversation-footer--dragging' : ''}  
          ${isDisabled ? 'conversation-footer--disabled' : ''}  
        `}
        onDragEnter={!isDisabled ? handleDragEnter : undefined}
        onDragOver={!isDisabled ? handleDragOver : undefined}
        onDragLeave={!isDisabled ? handleDragLeave : undefined}
        onDrop={!isDisabled ? handleDrop : undefined}
      >
        <div className="conversation-footer__top-menu">
          {(isStreaming || isWaitingForResponse) && (
            <button
              className="conversation-footer__abort-button"
              title={t("abort_title")}
              onClick={handleAbort}
            >
              {t("abort")}
            </button>
          )}
          {!isStreaming && lastMessageRole === BOT_ROLE && (
            <button
              className="conversation-footer__retry-button"
              title={t("retry_title")}
              onClick={handleRetry}
            >
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
            className="conversation-footer__file-upload"
            disabled={isDisabled}
            onClick={handleFileButtonClick}
          />

          <textarea
            ref={textareaRef}
            className={`  
              conversation-footer__textarea  
              ${isExpanded ? 'conversation-footer__textarea--expanded' : ''}  
            `}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("type_a_message")}
            disabled={isStreaming || isWaitingForResponse}
          />

          <SendButton
            className="conversation-footer__send-button"
            disabled={!input.trim() && fileList.length === 0}
            isStreaming={isStreaming}
            isWaitingForResponse={isWaitingForResponse}
            onClick={handleSend}
          />

          <button
            className="conversation-footer__paste-button"
            title={t("paste_title")}
            onClick={handlePaste}
            disabled={isStreaming}
          >
            {t("paste")}
          </button>

          <button
            className="conversation-footer__expand-button"
            onClick={toggleExpand}
            title={t("toggle_height_title")}
          >
            {!isExpanded ? t("shrink") : t("expand")}
          </button>

          <AudioRecorder
            className="conversation-footer__audio-recorder"
            isStreaming={isStreaming}
            setInput={setInput}
            setError={setError}
          />

          <input
            type="file"
            ref={fileInputRef}
            className="conversation-footer__file-input"
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

export default ConversationFooter;  
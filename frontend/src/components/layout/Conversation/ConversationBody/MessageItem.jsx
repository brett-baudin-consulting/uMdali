import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';

import ModalDialog from '../../../common/ModalDialog/ModalDialog';
import { messageShape } from '../../../../model/conversationPropType';
import { fetchImage } from '../../../../api/fileService';
import { convertTextToSpeech } from '../../../../api/textToSpeechModelService';
import CodeBlock from './CodeBlock';
import { handleKeyDown as handleKeyDownUtility } from "../../../common/util/useTextareaKeyHandlers";
import { userShape } from "../../../../model/userPropType";

import './MessageItem.scss';

function MessageItem({ message, onDelete, onEdit, userId, user }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message.content);
  const [imageUrls, setImageUrls] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const textareaRef = useRef(null);
  const audioRef = useRef(null);
  const maxLineCount = 4;
  const resetCopyState = useCallback(() => {
    setCopied(false);
  }, []);

  useEffect(() => {
    if (message.files && message.files.length > 0) {
      const fetchUrls = async () => {
        const urls = await Promise.all(
          message.files.map((file) => fetchImage(userId, file.name))
        );
        setImageUrls(urls);
      };
      fetchUrls().catch(console.error);
    }
  }, [message.files, userId]);

  const handleSpeakClick = useCallback(async () => {
    // If audio is currently playing, stop it and reset state
    if (isSpeaking && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Reset audio to start
      setIsSpeaking(false);
      return;
    }
  
    try {
      const audioBlob = await convertTextToSpeech(user.settings.textToSpeechModel, message.content);
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src); // Clean up previous audio object URL
      }
      // Use the existing audio element if it exists, otherwise create a new one
      const audioElement = audioRef.current || new Audio();
      audioElement.src = audioUrl;
      audioRef.current = audioElement; // Update the ref with the new or existing audio element
  
      setIsSpeaking(true);
      audioRef.current.onended = () => setIsSpeaking(false); // Reset state when audio ends
      audioRef.current.play();
    } catch (error) {
      console.error('Error playing text to speech:', error);
      setIsSpeaking(false); // Ensure state is reset on error
    }
  }, [isSpeaking, message.content, user.settings.textToSpeechModel]);

  const handleModalClose = useCallback(() => setIsModalOpen(false), []);

  const handleDeleteClick = useCallback(() => setIsModalOpen(true), []);

  const handleDeleteConfirm = useCallback(() => {
    setIsModalOpen(false);
    onDelete();
  }, [onDelete]);

  const handleEditClick = useCallback(() => {
    setEditedMessage(message.content);
    setIsEditing(true);
  }, [message.content]);

  const handleEditConfirm = useCallback(() => {
    setIsEditing(false);
    onEdit(editedMessage);
  }, [onEdit, editedMessage]);

  const handleEditChange = useCallback((event) => {
    setEditedMessage(event.target.value);
    event.target.style.height = 'auto';
    event.target.style.height = `${event.target.scrollHeight}px`;
  }, []);

  const handleExpandClick = useCallback(() => {
    setIsExpanded(true);
  }, []);

  const handleShrinkClick = useCallback(() => {
    setIsExpanded(false);
  }, []);

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  }, []);

  useEffect(() => {
    if (copied) {
      const timeoutId = setTimeout(resetCopyState, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [copied, resetCopyState]);

  const handleKeyDown = useCallback((event) => {
    handleKeyDownUtility(event, setEditedMessage, editedMessage, textareaRef, user.settings.macros);
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleEditConfirm();
    } else if (event.key === 'Escape') {
      setIsEditing(false);
      setEditedMessage(message.content);
    }
  }, [editedMessage, user.settings.macros, handleEditConfirm, message.content]);

  const renderers = useMemo(() => ({
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock
          value={String(children).replace(/\n$/, '')}
          language={match[1]}
          {...props}
        />
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  }), []);

  const lineCount = message.content.split('\n').length;

  return (
    <>
      {isModalOpen && (
        <ModalDialog
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onCancel={handleModalClose}
          onConfirm={handleDeleteConfirm}
        >
          <h4>{t('delete_message_title')}</h4>
          <h2>{t(message.role)}</h2>
          <p>{message.content.substring(0, 200)}</p>
        </ModalDialog>
      )}
      <div className="message-item">
        <div className="message-header">
          <div className="message-type" title={t(message.role + '_title')}>{t(message.role)}</div>
          <div className="message-actions">
            <div className="message-tool-bar">
              <button
                className="action-button"
                title={t('copy_to_clipboard_title')}
                onClick={() => copyToClipboard(message.content)}
              >
                {copied ? t('copied') : t('copy_to_clipboard')}
              </button>
              <button
                className="action-button"
                title={t('delete_title')}
                onClick={handleDeleteClick}
              >
                {t('delete')}
              </button>
              <button
                className="action-button"
                title={t('edit_title')}
                onClick={handleEditClick}
              >
                {t('edit')}
              </button>
              {!isExpanded && lineCount > maxLineCount && (
                <button className="action-button" onClick={handleExpandClick} title="Expand">
                  ↓
                </button>
              )}
              {isExpanded && lineCount > maxLineCount && (
                <button className="action-button" onClick={handleShrinkClick} title="Shrink">
                  ↑
                </button>
              )}
              <button
                className="action-button"
                title={t('speak_title')}
                onClick={handleSpeakClick}
              >
                {t('speak')}
              </button>
            </div>
          </div>
        </div>
        <div className="message-images">
          {imageUrls.map((url, index) => (
            <img key={index} src={url} alt={`Message attachment ${index + 1}`} />
          ))}
        </div>
        <div className={`message-content ${!isExpanded ? 'message-content-shrink' : ''}`}>
          {isEditing ? (
            <TextareaAutosize
              className="message-content-edit"
              value={editedMessage}
              onChange={handleEditChange}
              onBlur={handleEditConfirm}
              onKeyDown={handleKeyDown}
              autoFocus
              ref={textareaRef}
            />
          ) : (
            <ReactMarkdown components={renderers} remarkPlugins={[gfm]}>
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </>
  );
}

MessageItem.propTypes = {
  message: messageShape.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  userId: PropTypes.string.isRequired,
  user: userShape.isRequired,
};

export default MessageItem;
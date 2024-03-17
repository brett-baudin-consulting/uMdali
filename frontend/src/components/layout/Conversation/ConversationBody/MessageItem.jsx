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

const maxLineCount = 4;
const pauseDuration = 600;

function MessageItem({ message, onDelete, onEdit, userId, user, setError }) {
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
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    const textChunks = message.content.split('\n').filter(chunk => chunk.trim() !== '');

    // Function to convert text to speech and return a promise that resolves to the audio blob
    const convertChunkToSpeech = (chunk) => {
      const speech = convertTextToSpeech(
        user.settings.textToSpeechModel.model_id,
        chunk,
        user.settings.textToSpeechModel.voice_id,
        user.settings.textToSpeechModel.vendor
      );
      return speech;
    };

    // Function to play the audio blob
    const playAudioBlob = async (audioBlob) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src); // Clean up previous audio object URL
      }
      audioRef.current = new Audio(audioUrl);

      return new Promise((resolve) => {
        audioRef.current.onended = () => resolve();
        audioRef.current.play().catch(err => console.error('Playback error:', err));
      });
    };

    // Asynchronously prefetch and play audio chunks
    const prefetchAndPlayChunks = async () => {
      try {
        if (textChunks.length === 0) {
          throw new Error('No text chunks to process');
        }

        let hasNextChunk = true;
        let nextChunkIndex = 0;
        let nextAudioBlobPromise = convertChunkToSpeech(textChunks[nextChunkIndex]);

        while (hasNextChunk) {
          const currentAudioBlobPromise = nextAudioBlobPromise;

          nextChunkIndex++;
          hasNextChunk = nextChunkIndex < textChunks.length;
          nextAudioBlobPromise = hasNextChunk ? convertChunkToSpeech(textChunks[nextChunkIndex]) : null;

          const audioBlob = await currentAudioBlobPromise; // Wait for the current audio blob
          await playAudioBlob(audioBlob); // Play current chunk

          // Wait for the specified pause duration before proceeding, unless it's the last chunk
          if (hasNextChunk) {
            await new Promise(resolve => setTimeout(resolve, pauseDuration));
          }
        }
      } catch (error) {
        console.log('Error processing text to speech:', error);
        setError(error.message); // Use setError here to handle the error
      } finally {
        setIsSpeaking(false); // Reset state when all chunks have been played or an error occurs
      }
    };

    prefetchAndPlayChunks().catch(error => {
      console.error('Error processing text to speech:', error);
      setIsSpeaking(false);
    });
  }, [isSpeaking, message.content, pauseDuration, setError, user.settings.textToSpeechModel.model_id, user.settings.textToSpeechModel.vendor, user.settings.textToSpeechModel.voice_id]);

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
                title={isSpeaking ? t('stop_speaking_title') : t('speak_title')}
                onClick={handleSpeakClick}
              >
                {isSpeaking ? t('stop') : t('speak')}
              </button>
            </div>
          </div>
        </div>
        <div className="message-images">
          {imageUrls.map((url) => (
            <img key={url} src={url} alt="Message attachment" />
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
  setError: PropTypes.func.isRequired,
};

export default MessageItem;
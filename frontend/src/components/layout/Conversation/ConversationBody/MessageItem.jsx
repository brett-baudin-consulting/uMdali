import React, { useState, useCallback, useEffect, useMemo } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';

import ModalDialog from '../../../common/ModalDialog/ModalDialog';
import './MessageItem.scss';
import { messageShape } from '../../../../model/conversationPropType';
import { fetchImage } from '../../../../api/fileService';
import CodeBlock from './CodeBlock';

function MessageItem({ message, onDelete, onEdit, userId }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setModalOpen] = useState(false);
  const [isEditing, setEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message.content);
  const [imageUrls, setImageUrls] = useState([]);

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

  const handleModalClose = useCallback(() => setModalOpen(false), []);

  const handleDeleteClick = useCallback(() => setModalOpen(true), []);

  const handleDeleteConfirm = useCallback(() => {
    setModalOpen(false);
    onDelete();
  }, [onDelete]);

  const handleEditClick = useCallback(() => {
    setEditedMessage(message.content);
    setEditing(true);
  }, [message.content]);

  const handleEditConfirm = useCallback(() => {
    setEditing(false);
    onEdit(editedMessage);
  }, [onEdit, editedMessage]);

  const handleEditChange = useCallback((event) => {
    setEditedMessage(event.target.value);
    event.target.style.height = 'auto';
    event.target.style.height = `${event.target.scrollHeight}px`;
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

  const handleOnKeyDown = useCallback((event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleEditConfirm();
    } else if (event.key === 'Escape') {
      setEditing(false);
      setEditedMessage(message.content);
    }
  }, [handleEditConfirm, message.content]);

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
            </div>
          </div>
        </div>
        <div className="message-images">
          {imageUrls.map((url, index) => (
            <img key={index} src={url} alt={`Message attachment ${index + 1}`} />
          ))}
        </div>
        <div className="message-content">
          {isEditing ? (
            <TextareaAutosize
              className="message-content-edit"
              value={editedMessage}
              onChange={handleEditChange}
              onBlur={handleEditConfirm}
              onKeyDown={handleOnKeyDown}
              autoFocus
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
};

export default MessageItem;
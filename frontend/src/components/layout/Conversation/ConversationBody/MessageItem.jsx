import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';

import ModalDialog from '../../../common/ModalDialog/ModalDialog';
import { messageShape } from '../../../../model/conversationPropType';
import { fetchImage } from '../../../../api/fileService';
import CodeBlock from './CodeBlock';
import { handleKeyDown as handleKeyDownUtility } from "../../../common/util/useTextareaKeyHandlers";
import { userShape } from "../../../../model/userPropType";
import MessageItemToolbar from './MessageItemToolbar';

import './MessageItem.scss';

const maxLineCount = 4;

function MessageItem({ message, onDelete, onEdit, userId, user, setError }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message.content);
  const [imageUrls, setImageUrls] = useState([]);
  const [isExpanded, setIsExpanded] = useState(true);
  const textareaRef = useRef(null);
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
            <MessageItemToolbar
              onCopy={() => copyToClipboard(message.content)}
              onDelete={handleDeleteClick}
              onEdit={handleEditClick}
              copied={copied}
              isExpanded={isExpanded}
              lineCount={lineCount}
              maxLineCount={maxLineCount}
              message={message}
              user={user}
              setError={setError}
              setIsExpanded={setIsExpanded}
            />          </div>
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
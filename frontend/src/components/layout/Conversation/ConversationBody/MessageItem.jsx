// MessageItem.jsx  
import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { deleteFile } from '../../../../api/fileService';
import MessageHeader from './MessageHeader';
import MessageActions from './MessageActions';
import MessageContent from './MessageContent';
import MessageErrorBoundary from './MessageErrorBoundary';
import { CONSTANTS } from './constants';
import { messageShape, conversationShape } from '../../../../model/conversationPropType';
import { userShape } from "../../../../model/userPropType";
import useVoice from './UseVoice';
import './MessageItem.scss';

const MessageItem = React.memo(function MessageItem({
  message,
  onDelete,
  onEdit,
  user,
  setError,
  currentConversation,
  setCurrentConversation
}) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message.content);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const textareaRef = useRef(null);

  const { isSpeaking, handleSpeakClick } = useVoice(user, currentConversation, message, setError);

  const resetCopyState = useCallback(() => {
    setCopied(false);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
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

  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch (err) {
      setError('Failed to copy text');
    }
  }, [setError]);

  useEffect(() => {
    if (copied) {
      const timeoutId = setTimeout(resetCopyState, CONSTANTS.COPY_TIMEOUT);
      return () => clearTimeout(timeoutId);
    }
  }, [copied, resetCopyState]);

  const handleDeleteFile = useCallback(async (fileToDelete) => {
    if (!currentConversation?.userId) return;
    setIsDeleting(true);

    try {
      await deleteFile(currentConversation.userId, fileToDelete.name);
      setCurrentConversation(prev => ({
        ...prev,
        messages: prev.messages.map(msg =>
          msg.messageId !== message.messageId ? msg : {
            ...msg,
            files: msg.files.filter(file => file.name !== fileToDelete.name)
          }
        )
      }));
    } catch (error) {
      setError("Failed to delete file");
    } finally {
      setIsDeleting(false);
    }
  }, [currentConversation.userId, message.messageId, setCurrentConversation, setError]);

  return (
    <MessageErrorBoundary>
      <div className="message-item">
        <div className="message-item__header-container">
          <MessageHeader
            message={message}
            currentConversation={currentConversation}
            t={t}
          />
          <MessageActions
            copied={copied}
            isSpeaking={isSpeaking}
            isExpanded={isExpanded}
            lineCount={message.content.split('\n').length}
            onCopy={() => copyToClipboard(message.content)}
            onDelete={handleDeleteConfirm}
            onEdit={handleEditClick}
            onExpand={() => setIsExpanded(true)}
            onShrink={() => setIsExpanded(false)}
            onSpeak={handleSpeakClick}
            t={t}
          />
        </div>
        <MessageContent
          message={message}
          isEditing={isEditing}
          editedMessage={editedMessage}
          isExpanded={isExpanded}
          textareaRef={textareaRef}
          onEditChange={setEditedMessage}
          onEditConfirm={handleEditConfirm}
          currentConversation={currentConversation}
          onDeleteFile={handleDeleteFile}
          isDeleting={isDeleting}
        />
      </div>
    </MessageErrorBoundary>
  );
});

MessageItem.propTypes = {
  message: messageShape.isRequired,
  onDelete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  user: userShape.isRequired,
  setError: PropTypes.func.isRequired,
  currentConversation: conversationShape.isRequired,
  setCurrentConversation: PropTypes.func.isRequired,
};

export default MessageItem;  
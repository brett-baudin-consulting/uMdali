import React, { useState, memo, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

import ModalDialog from "../../common/ModalDialog/ModalDialog";
import { conversationShape } from "../../../model/conversationPropType";
import { sendMessage } from "../../../api/messageService";
import { userShape } from "../../../model/userPropType";

import "./ConversationItem.scss";

const ConversationItem = ({
  conversation,
  isSelected,
  deleteConversation,
  updateConversation,
  user,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [isCreatingTitle, setIsCreatingTitle] = useState(false);

  const { t } = useTranslation();

  const handleEditClick = () => {
    setTitle(conversation.title);
    setIsEditing(true);
  };

  const handleModalClose = () => setIsModalOpen(false);

  const handleCreateTitle = async () => {
    setIsCreatingTitle(true);
    const abortController = new AbortController();
    const { signal } = abortController;

    try {
      const newUserMessage = {
        content: t("create_conversation_title_instruction"),
        role: "user",
        messageId: uuidv4(),
        files: null,
      };
      const filteredMessages = conversation.messages.filter(message => message.role !== "context");
      const updatedConversation = {
        ...conversation,
        messages: [...filteredMessages, newUserMessage],
      };
      const data = await sendMessage(updatedConversation, user, signal);
      if (data?.content) {
        const titleWithoutQuotes = data.content.replace(/"/g, '');
        updateConversation({ ...conversation, title: titleWithoutQuotes });
        setTitle(titleWithoutQuotes);
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Failed to send message to create new title:', error);
      }
    } finally {
      setIsCreatingTitle(false);
      abortController.abort();
    }
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const handleTitleBlur = () => {
    updateConversation({ ...conversation, title });
    setIsEditing(false);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      updateConversation({ ...conversation, title });
      setIsEditing(false);
    } else if (event.key === "Escape") {
      setIsEditing(false);
    }
  };

  const handleDeleteClick = () => setIsModalOpen(true);

  const handleDeleteConfirm = () => {
    setIsModalOpen(false);
    deleteConversation(conversation.conversationId);
  };

  const conversationJson = JSON.stringify(conversation, null, 2);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(conversationJson);
      setCopied(true);
    } catch (error) {
      console.error('Failed to copy text: ', error);
    }
  };

  useEffect(() => {
    let timeoutId;

    if (copied) {
      timeoutId = setTimeout(() => setCopied(false), 2000);
    }

    return () => clearTimeout(timeoutId);
  }, [copied]);

  const areButtonsDisabled = isCreatingTitle || isEditing;

  return (
    <>
      {isModalOpen && (
        <ModalDialog
          isOpen={isModalOpen}
          onClose={handleModalClose}
          onCancel={handleModalClose}
          onConfirm={handleDeleteConfirm}
        >
          <h4>{t("delete_conversation_title")}</h4>
          <p>{conversation.title}</p>
        </ModalDialog>
      )}
      <div className="conversation-item">
        {isEditing ? (
          <input
            className="conversation-title-input"
            value={title}
            onChange={handleTitleChange}
            onBlur={handleTitleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        ) : (
          <div className="conversation-title" title={conversation.title}>
            {`(${conversation.messages.length}) ${title}`}
          </div>
        )}
        {isSelected && (
          <div className="conversation-actions">
            <button
              className="action-button"
              title={t("copy_to_clipboard_title")}
              onClick={handleCopyClick}
              disabled={areButtonsDisabled}
            >
              {copied ? t("copied") : t("copy_to_clipboard")}
            </button>
            <button
              className="action-button"
              title={t("delete_title")}
              onClick={handleDeleteClick}
              disabled={areButtonsDisabled}
            >
              {t("delete")}
            </button>
            <button
              className="action-button"
              title={t("edit_title")}
              onClick={handleEditClick}
              disabled={areButtonsDisabled}
            >
              {t("edit")}
            </button>
            <button
              className="action-button"
              title={t("create_conversation_title_title")}
              onClick={handleCreateTitle}
              disabled={areButtonsDisabled}
            >
              {t("create_conversation_title")}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

ConversationItem.propTypes = {
  conversation: conversationShape.isRequired,
  isSelected: PropTypes.bool.isRequired,
  deleteConversation: PropTypes.func.isRequired,
  updateConversation: PropTypes.func.isRequired,
  user: userShape.isRequired,
};

export default memo(ConversationItem);
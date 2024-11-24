import React, { useState, memo, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";

import ModalDialog from "../../common/ModalDialog/ModalDialog.jsx";
import { conversationShape } from "../../../model/conversationPropType";
import { userShape } from "../../../model/userPropType";
import { createTitle } from "./createTitle";

import "./ConversationItem.scss";

const ConversationItem = ({
  conversation,
  isSelected,
  deleteConversation,
  updateConversation,
  user,
  models,
  setCurrentConversation,
  setIsStreaming,
  setIsWaitingForResponse,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(conversation.title);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setTitle(conversation.title);
  }, [conversation.title]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleTitleChange = (event) => {
    setTitle(event.target.value);
  };

  const handleSaveTitle = () => {
    updateConversation({ ...conversation, title });
    setIsEditing(false);
  };

  const handleTitleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSaveTitle();
    } else if (event.key === "Escape") {
      setIsEditing(false);
      setTitle(conversation.title); // Revert to original title on Escape  
    }
  };


  const handleDeleteClick = () => setIsModalOpen(true);

  const handleDeleteConfirm = () => {
    deleteConversation(conversation.conversationId);
    setIsModalOpen(false);
  };

  const handleModalClose = () => setIsModalOpen(false);

  const handleCopyClick = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(conversation, null, 2));
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy text: ", error);
    }
  };

  useEffect(() => {
    let timeoutId;
    if (copied) {
      timeoutId = setTimeout(() => setCopied(false), 2000);
    }
    return () => clearTimeout(timeoutId);
  }, [copied]);


  const handleCreateTitle = async () => {  
    const newTitle = await createTitle(conversation, setCurrentConversation, user, models, t, setIsStreaming, setIsWaitingForResponse);  
    if (newTitle) {  
      setCurrentConversation((prevConversation) => ({ ...prevConversation, title: newTitle }));  
    }  
  };

  const renderConversationTitle = () => {
    const participantType = conversation.isAIConversation ? t("bot") : t("user");
    const conversationTitle = `${participantType} ↔️ ${t("bot")} (${conversation.messages.length}) ${title}`;

    return (
      <div className="conversation-title" title={conversation.title}>
        {conversationTitle}
      </div>
    );
  };

  return (
    <>
      <div className="conversation-item">
        {isEditing ? (
          <input
            className="conversation-title-input"
            value={title}
            onChange={handleTitleChange}
            onKeyDown={handleTitleKeyDown}
            onBlur={handleSaveTitle}
            autoFocus
          />
        ) : (
          renderConversationTitle()
        )}
        {isSelected && (
          <div className="conversation-actions">
            <button
              className="action-button"
              title={t("copy_to_clipboard_title")}
              onClick={handleCopyClick}
              disabled={isEditing}
            >
              {copied ? t("copied") : t("copy_to_clipboard")}
            </button>
            <button
              className="action-button"
              title={t("delete_title")}
              onClick={handleDeleteClick}
              disabled={isEditing}
            >
              {t("delete")}
            </button>
            <button
              className="action-button"
              title={t("edit_title")}
              onClick={handleEditClick}
              disabled={isEditing}
            >
              {t("edit")}
            </button>
            <button
              className="action-button"
              title={t("create_conversation_title_title")}
              onClick={handleCreateTitle}
              disabled={isEditing}
            >
              {t("create_conversation_title")}
            </button>
          </div>
        )}
      </div>
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
    </>
  );
};

ConversationItem.propTypes = {
  conversation: conversationShape.isRequired,
  isSelected: PropTypes.bool.isRequired,
  deleteConversation: PropTypes.func.isRequired,
  updateConversation: PropTypes.func.isRequired,
  user: userShape.isRequired,
  models: PropTypes.array.isRequired,
  setCurrentConversation: PropTypes.func.isRequired,
  setIsStreaming: PropTypes.func.isRequired,
  setIsWaitingForResponse: PropTypes.func.isRequired,
};

export default memo(ConversationItem);
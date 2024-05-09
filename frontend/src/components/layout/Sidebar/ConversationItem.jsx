import React, { useState, memo, useEffect } from "react";  
import PropTypes from "prop-types";  
import { useTranslation } from "react-i18next";

import ModalDialog from "../../common/ModalDialog/ModalDialog";  
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
  setIsWaitingForResponse
}) => {  
  const [isEditing, setIsEditing] = useState(false);  
  const [isModalOpen, setIsModalOpen] = useState(false);  
  const [copied, setCopied] = useState(false);  
  const [title, setTitle] = useState(conversation.title); // Initialize with conversation.title

  const { t } = useTranslation();

  useEffect(() => {  
    if (!isEditing) {  
      setTitle(conversation.title);  
    }  
    // Log to see if the effect is running as expected  
  }, [conversation.title, isEditing]); // Depend on isEditing to decide when to sync

  const handleEditClick = () => {  
    setIsEditing(true);  
  };

  const handleTitleChange = (event) => {  
    setTitle(event.target.value);  
  };

  const handleModalClose = () => setIsModalOpen(false);

  const handleCreateTitle = async () => {  
    const newTitle = await createTitle(conversation, setCurrentConversation, user, models, t, setIsStreaming, setIsWaitingForResponse);  
    setCurrentConversation((prevConversation) => ({
      ...prevConversation,
      title: newTitle ?? prevConversation.title,
    }));
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

  const handleCopyClick = async () => {  
    try {  
      await navigator.clipboard.writeText(JSON.stringify(conversation, null, 2));  
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

  const areButtonsDisabled = isEditing;

  function renderConversationTitle(conversation, title) {  
    const participantType = conversation.isAIConversation ? t('bot') : t('user');  
    const conversationTitle = `${participantType} ↔️ ${t('bot')} (${conversation.messages.length}) ${title}`;  
    
    return (  
      <div className="conversation-title" title={conversation.title}>  
        {conversationTitle}  
      </div>  
    );  
  }

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
          renderConversationTitle(conversation, title)  
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
  models: PropTypes.array.isRequired,  
  setCurrentConversation: PropTypes.func.isRequired,
  setIsStreaming: PropTypes.func.isRequired,
  setIsWaitingForResponse: PropTypes.func.isRequired
};

export default memo(ConversationItem);  
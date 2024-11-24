// ConversationBody.jsx  
import React, { useRef, useLayoutEffect, useMemo, memo } from "react";
import PropTypes from "prop-types";
import MessageItem from "../ConversationBody/MessageItem.jsx";
import { conversationShape } from "../../../../model/conversationPropType";
import { userShape } from "../../../../model/userPropType";
import "./ConversationBody.scss";

const MemoizedMessageItem = memo(MessageItem);

const ConversationBody = ({
  currentConversation,
  setCurrentConversation,
  setConversations,
  user,
  setError,
}) => {
  const messagesEndRef = useRef(null);

  useLayoutEffect(() => {
    const scrollElement = messagesEndRef.current;
    if (scrollElement) {
      scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [currentConversation?.messages]);

  const messageHandlers = useMemo(() => ({
    updateConversation: (updatedConversation) => {
      setConversations((prevConversations) =>
        prevConversations.map((conversation) =>
          conversation.conversationId === updatedConversation.conversationId
            ? updatedConversation
            : conversation
        )
      );
      setCurrentConversation(updatedConversation);
    },

    deleteMessage: (messageId) => {
      const updatedConversation = {
        ...currentConversation,
        messages: currentConversation.messages.filter(
          (message) => message.messageId !== messageId
        ),
      };
      messageHandlers.updateConversation(updatedConversation);
    },

    editMessage: (messageId, newContent) => {
      const updatedConversation = {
        ...currentConversation,
        messages: currentConversation.messages.map((message) =>
          message.messageId === messageId
            ? { ...message, content: newContent }
            : message
        ),
      };
      messageHandlers.updateConversation(updatedConversation);
    },
  }), [currentConversation, setConversations, setCurrentConversation]);

  return (
    <div className="conversation-body">
      <ul className="conversation-body__message-list" ref={messagesEndRef}>
        {currentConversation?.messages?.map((msg) => (
          <li
            key={msg.messageId}
            className={`conversation-body__message conversation-body__message--${msg.role}`}
          >
            <MemoizedMessageItem
              message={msg}
              onDelete={() => messageHandlers.deleteMessage(msg.messageId)}
              onEdit={(newContent) => messageHandlers.editMessage(msg.messageId, newContent)}
              user={user}
              setError={setError}
              currentConversation={currentConversation}
              setCurrentConversation={setCurrentConversation}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

ConversationBody.propTypes = {
  currentConversation: conversationShape,
  setConversations: PropTypes.func.isRequired,
  setCurrentConversation: PropTypes.func.isRequired,
  user: userShape.isRequired,
  setError: PropTypes.func.isRequired,
};

export default memo(ConversationBody);  
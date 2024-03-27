import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";

import MessageItem from "../ConversationBody/MessageItem";
import { conversationShape } from "../../../../model/conversationPropType";
import { userShape } from "../../../../model/userPropType";

import "./AIConversationBody.scss";

const AIConversationBody = ({
  currentConversation,
  setCurrentConversation,
  setConversations,
  user,
  setError
}) => {

  const messagesEndRef = useRef(null);
  const contextMessageA = {
    messageId: "context",
    content: "Context A",
    role: "context",
    timestamp: new Date().toISOString(),
  };
  const contextMessageB = {
    messageId: "context",
    content: "Context B",
    role: "context",
    timestamp: new Date().toISOString(),
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTop = messagesEndRef.current.scrollHeight;
    }
  }, [currentConversation]);

  const deleteMessage = (messageId) => {
    const newMessages = currentConversation.messages.filter(
      (message) => message.messageId !== messageId
    );

    const updatedConversation = {
      ...currentConversation,
      messages: newMessages,
    };

    setConversations((prevConversations) =>
      prevConversations.map((conversation) =>
        conversation.conversationId === updatedConversation.conversationId
          ? updatedConversation
          : conversation
      )
    );
    setCurrentConversation(updatedConversation);
  };

  const editMessage = (messageId, newContent) => {
    const newMessages = currentConversation.messages.map((message) =>
      message.messageId === messageId
        ? { ...message, content: newContent }
        : message
    );

    const updatedConversation = {
      ...currentConversation,
      messages: newMessages,
    };

    setConversations((prevConversations) =>
      prevConversations.map((conversation) =>
        conversation.conversationId === updatedConversation.conversationId
          ? updatedConversation
          : conversation
      )
    );
    setCurrentConversation(updatedConversation);
  };

  return (
    <div className="conversation-body">
      <div className="scrollable-container" ref={messagesEndRef}>
        <MessageItem
          message={contextMessageA}
          onDelete={() => deleteMessage("msg.messageId")}
          onEdit={(newContent) => editMessage("msg.messageId", newContent)}
          userId={user.userId}
          user={user}
          setError={setError}
        />
        <MessageItem
          message={contextMessageB}
          onDelete={() => deleteMessage("msg.messageId")}
          onEdit={(newContent) => editMessage("msg.messageId", newContent)}
          userId={user.userId}
          user={user}
          setError={setError}
        />
        <ul>
          {currentConversation?.messages?.map((msg, index) => (
            <li key={msg.messageId} className={msg.role}>
              <MessageItem
                message={msg}
                onDelete={() => deleteMessage(msg.messageId)}
                onEdit={(newContent) => editMessage(msg.messageId, newContent)}
                userId={currentConversation.userId}
                user={user}
                setError={setError}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

AIConversationBody.propTypes = {
  currentConversation: conversationShape,
  setConversations: PropTypes.func.isRequired,
  setCurrentConversation: PropTypes.func.isRequired,
  user: userShape.isRequired,
  setError: PropTypes.func.isRequired
};

export default AIConversationBody;
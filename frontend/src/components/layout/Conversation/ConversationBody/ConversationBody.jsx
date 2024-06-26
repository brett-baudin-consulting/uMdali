import React, { useRef, useEffect } from "react";
import PropTypes from "prop-types";

import MessageItem from "../ConversationBody/MessageItem";
import { conversationShape } from "../../../../model/conversationPropType";
import { userShape } from "../../../../model/userPropType";

import "./ConversationBody.scss";

const ConversationBody = ({
  currentConversation,
  setCurrentConversation,
  setConversations,
  user,
  setError

}) => {

  const messagesEndRef = useRef(null);


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
          ? { ...updatedConversation }
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
        <ul>
          {currentConversation?.messages?.map((msg, index) => (
            <li key={msg.messageId} className={msg.role}>
              <MessageItem
                message={msg}
                onDelete={() => deleteMessage(msg.messageId)}
                onEdit={(newContent) => editMessage(msg.messageId, newContent)}
                user={user}
                setError={setError}
                currentConversation={currentConversation}
                setCurrentConversation={setCurrentConversation}
              />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );

};

ConversationBody.propTypes = {
  currentConversation: conversationShape,
  setConversations: PropTypes.func.isRequired,
  setCurrentConversation: PropTypes.func.isRequired,
  user: userShape.isRequired,
  setError: PropTypes.func.isRequired
};

export default ConversationBody;
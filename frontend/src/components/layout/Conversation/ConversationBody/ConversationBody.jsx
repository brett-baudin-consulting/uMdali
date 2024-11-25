import React, { useRef, useEffect } from "react";  
import PropTypes from "prop-types";

import MessageItem from "../ConversationBody/MessageItem.jsx";  
import { conversationShape } from "../../../../model/conversationPropType";  
import { userShape } from "../../../../model/userPropType";

import "./ConversationBody.scss";

const ConversationBody = ({  
  currentConversation,  
  setCurrentConversation,  
  setConversations,  
  user,  
  setError,  
}) => {  
  const messagesEndRef = useRef(null);

  useEffect(() => {  
    messagesEndRef.current?.scrollTo({  
      top: messagesEndRef.current.scrollHeight,  
      behavior: "smooth", // Optional smooth scrolling    
    });  
  }, [currentConversation]);

  const updateConversation = (updatedConversation) => {  
    setConversations((prevConversations) =>  
      prevConversations.map((conversation) =>  
        conversation.conversationId === updatedConversation.conversationId  
          ? updatedConversation  
          : conversation  
      )  
    );  
    setCurrentConversation(updatedConversation);  
  };

  const deleteMessage = (messageId) => {  
    console.log("deleteMessage", messageId);
    const updatedConversation = {  
      ...currentConversation,  
      messages: currentConversation.messages.filter(  
        (message) => message.messageId !== messageId  
      ),  
    };  
    updateConversation(updatedConversation);  
  };

  const editMessage = (messageId, newContent) => {  
    const updatedConversation = {  
      ...currentConversation,  
      messages: currentConversation.messages.map((message) =>  
        message.messageId === messageId  
          ? { ...message, content: newContent }  
          : message  
      ),  
    };

    updateConversation(updatedConversation);  
  };

  return (  
    <div className="conversation-body">  
      <ul className="message-list" ref={messagesEndRef}>  
        {currentConversation?.messages?.map((msg) => (  
          <li key={msg.messageId} className={`message ${msg.role}`}>  
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
  );  
};

ConversationBody.propTypes = {  
  currentConversation: conversationShape,  
  setConversations: PropTypes.func.isRequired,  
  setCurrentConversation: PropTypes.func.isRequired,  
  user: userShape.isRequired,  
  setError: PropTypes.func.isRequired,  
};

export default ConversationBody;  
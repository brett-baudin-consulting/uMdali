import React from 'react';  
import PropTypes from 'prop-types';  
import { messageShape, conversationShape } from '../../../../model/conversationPropType';

function MessageHeader({ message, currentConversation, t }) {  
  return (  
    <div className="message-item__header">  
      <div className="message-item__type" title={t(`${message.role}_title`)}>  
        {!currentConversation.isAIConversation ? (  
          message.role === 'bot'   
            ? `${t(message.role)} (${message.modelName})`  
            : t(message.role)  
        ) : (  
          message.role === 'context'  
            ? `${t("context")} ${message.alias} (${message.modelName})`  
            : `${t("bot")} ${message.alias} (${message.modelName})`  
        )}  
      </div>  
    </div>  
  );  
}

MessageHeader.propTypes = {  
  message: messageShape.isRequired,  
  currentConversation: conversationShape.isRequired,  
  t: PropTypes.func.isRequired,  
};

export default React.memo(MessageHeader);  
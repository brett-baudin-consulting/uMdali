import { v4 as uuidv4 } from "uuid";  
import { sendMessage } from "../../../api/messageService";

export async function createTitle(currentConversation, setConversation, user, models, t, setIsStreaming, setIsWaitingForResponse ) {  
  const abortController = new AbortController();  
  const { signal } = abortController;

  try {  
    const newUserMessage = {  
      content: t("create_conversation_title_instruction"),  
      role: "user",  
      messageId: uuidv4(),  
      files: [],  
    };

    let filteredMessages = currentConversation.messages.filter(message => message.role !== "context");  

    const model = getModel(user, models);

    if (currentConversation.isAIConversation) {  
      filteredMessages = filteredMessages.slice(1);  
    }  
    const updatedConversation = {  
      ...currentConversation,  
      messages: [...filteredMessages, newUserMessage],  
    };

    const data = await sendMessage(updatedConversation, user, setConversation, uuidv4(), setIsStreaming, model, signal, setIsWaitingForResponse);  

    const newTitle = data;
    if (newTitle?.content) {  
      return newTitle.content.replace(/"/g, '');  
    }  
  } catch (error) {  
    if (error.name !== 'AbortError') {  
      console.error('Failed to send message to create new title:', error);  
    }  
  } 
}

function getModel(user, models) {  
  let modelName = user.settings.model;  
  if (modelName.indexOf('/') === -1) {
    const model = models.find((model) => model.name === modelName)
    modelName = model.vendor + '/' + model.name;
  }

  const [vendor, name] = modelName.split('/');  
  return models.find(model => model.vendor === vendor && model.name === name);  
}  
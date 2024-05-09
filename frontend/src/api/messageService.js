import { SERVER_BASE_URL } from "../config/config";
import { COMMON_HEADERS } from "../constants";

// sendMessage simplifies error handling and streamlines response processing  
export const sendMessage = async (currentConversation,
  user, setCurrentConversation, newBotMessageMessageId, setIsStreaming, model, signal, setIsWaitingForResponse, stream) => {
  const filteredMessages = filterMessages(currentConversation, newBotMessageMessageId);
  const requestBody = {
    title: currentConversation.title,
    messageId: newBotMessageMessageId,
    userDetails: user,
    conversationId: currentConversation.conversationId,
    message: filteredMessages,
    stream: stream,
    model: model,
  };
  setIsStreaming(stream);
  // Utilize AbortController for better fetch control  
  const options = {
    method: "POST",
    headers: COMMON_HEADERS,
    body: JSON.stringify(requestBody),
    signal: signal,
  };

  try {
    const response = await fetch(`${SERVER_BASE_URL}/message`, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error sending message: ${errorText}`);
    }

    // Handle streaming and synchronous response differently  
    return stream
      ? await streamResponse(response, setCurrentConversation, newBotMessageMessageId, setIsStreaming, signal)
      : await syncResponse(response, setCurrentConversation, newBotMessageMessageId, setIsWaitingForResponse);
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error("Failed to process stream:", error);
      throw error;
    }
  } finally {
    setIsStreaming(false);
    setIsWaitingForResponse(false);
  }
};

const syncResponse = async (response, setCurrentConversation, newBotMessageMessageId, setIsWaitingForResponse) => {
  const data = await response.json();
  setIsWaitingForResponse(false);
  updateConversationState(data?.content, newBotMessageMessageId, setCurrentConversation);
  return data;
};
// Refactor streamResponse to improve readability and error handling  
const streamResponse = async (response, setCurrentConversation, newBotMessage, setIsStreaming, signal) => {
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let data = "";

    while (true) {
      const { done, value } = await reader.read();
      if (signal.aborted) throw new Error("AbortError");
      if (done) break;
      data += value;
      updateConversationState(data, newBotMessage, setCurrentConversation);
    }
    return { "content": data};
};

// Utility function to update conversation state  
function updateConversationState(data, newBotMessageMessageId, setCurrentConversation) {
  setCurrentConversation(prev => ({
    ...prev,
    messages: prev.messages.map(msg =>
      msg.messageId === newBotMessageMessageId ? { ...msg, content: data } : msg
    ),
  }));
}

// Utility function to filter messages  
function filterMessages(currentConversation, newBotMessageMessageId) {
  return currentConversation.messages.filter(
    message => message.content !== "" && message.messageId !== newBotMessageMessageId
  );
}  
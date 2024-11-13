import { apiClient } from './apiClient';

export const sendMessage = async (
  currentConversation,
  user,
  setCurrentConversation,
  newBotMessageMessageId,
  setIsStreaming,
  model,
  signal,
  setIsWaitingForResponse,
  stream
) => {
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

  try {
    const response = await apiClient.fetch('/message', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      signal: signal,
      stream: stream, // Add stream flag for apiClient  
    });

    if (stream) {
      return await streamResponse(response, setCurrentConversation, newBotMessageMessageId, setIsStreaming, signal);
    } else {
      return await syncResponse(response, setCurrentConversation, newBotMessageMessageId, setIsWaitingForResponse);
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error("Failed to process message:", error);
      throw error;
    }
  } finally {
    setIsStreaming(false);
    setIsWaitingForResponse(false);
  }
};

const syncResponse = async (data, setCurrentConversation, newBotMessageMessageId, setIsWaitingForResponse) => {
  setIsWaitingForResponse(false);
  updateConversationState(data?.content, newBotMessageMessageId, setCurrentConversation);
  return data;
};

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
  return { "content": data };
};

function updateConversationState(data, newBotMessageMessageId, setCurrentConversation) {
  setCurrentConversation(prev => ({
    ...prev,
    messages: prev.messages.map(msg =>
      msg.messageId === newBotMessageMessageId ? { ...msg, content: data } : msg
    ),
  }));
}

function filterMessages(currentConversation, newBotMessageMessageId) {
  return currentConversation.messages.filter(
    message => message.content !== "" && message.messageId !== newBotMessageMessageId
  );
}  
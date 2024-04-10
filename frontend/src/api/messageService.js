import { v4 as uuidv4 } from "uuid";

import { SERVER_BASE_URL } from "../config/config";
import { COMMON_HEADERS } from "../constants";

export const sendMessage = async (
  currentConversation,
  user,
  signal,
  isSupportsVision,
  model
) => {
  const filteredMessages = currentConversation.messages.filter(message => message.content !== "");
  const options = {
    method: "POST",
    headers: COMMON_HEADERS,
    body: JSON.stringify({
      title: currentConversation.title,
      messageId: uuidv4(),
      userId: user.userId,
      userDetails: user,
      conversationId: currentConversation.conversationId,
      message: filteredMessages,
      isSupportsVision: isSupportsVision,
      model: model,
    }),
    signal: signal,
  };
  try {
    const response = await fetch(`${SERVER_BASE_URL}/message`, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error sending message: ${errorText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to send message:", error);
    throw error;
  }
};

export const sendMessageStreamResponse = async (
  user,
  currentConversation,
  setCurrentConversation,
  newBotMessage,
  setIsStreaming,
  signal,
  isSupportsVision,
  model
) => {
  const localMessages = filterMessages(currentConversation, newBotMessage);
  if (!localMessages.length) {
    setIsStreaming(false);
    return;
  }
  try {
    const options = {
      method: "POST",
      headers: COMMON_HEADERS,
      body: JSON.stringify({
        title: currentConversation.title,
        messageId: uuidv4(),
        userId: user.userId,
        userDetails: user,
        conversationId: currentConversation.conversationId,
        message: localMessages,
        stream: true,
        isSupportsVision: isSupportsVision,
        model: model,
      }),
      signal: signal,
    };

    const response = await fetch(`${SERVER_BASE_URL}/message`, options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error sending message: ${errorText}`);
    }

    let data = "";
    const reader = response.body
      .pipeThrough(new TextDecoderStream())
      .getReader();

    async function processText() {
      try {
        let { done, value } = await reader.read();
        if (done) {
          setIsStreaming(false);
          return;
        }
        if (signal.aborted) {
          await reader.cancel();
          setIsStreaming(false);
          return;
        }
        data += value;
        // Update the conversation state immutably
        setCurrentConversation((prevConversation) => {
          if (!prevConversation) {
            return {
              messages: [],
            };
          }
          return {
            ...prevConversation,
            messages: prevConversation.messages.map((message) =>
              message.messageId === newBotMessage.messageId
                ? { ...message, content: data }
                : message
            ),
          };
        });
        await processText(); // Recursively call processText until done or aborted
      } catch (error) {
        if (error.name === 'AbortError' || signal.aborted) {
          setIsStreaming(false);
        } else {
          console.error("Failed to process stream:", error);
          throw error;
        }
      }
    }

    await processText(); // Start processing the text
  } catch (error) {
    if (error.name === 'AbortError') {
      // Do nothing, as the error is expected due to aborting the request.
    } else {
      console.error("Failed to send message:", error);
      throw error;
    }
  }
};

export const updateMessage = async (messageId, newContent) => {
  const abortController = new AbortController();
  const response = await fetch(`${SERVER_BASE_URL}/message/${messageId}`, {
    method: "PUT",
    headers: COMMON_HEADERS,
    body: JSON.stringify({ content: newContent }),
    signal: abortController.signal,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to update message.");
  }
};

export const deleteMessage = async (messageId, messages) => {
  const abortController = new AbortController();
  if (window.confirm("Are you sure you want to delete this message?")) {
    const response = await fetch(
      `${SERVER_BASE_URL}/message/${messageId}/delete`,
      {
        method: "PUT",
        headers: COMMON_HEADERS,
        signal: abortController.signal,
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete the message");
    }
  }
};

function filterMessages(currentConversation, newBotMessage) {
  return currentConversation.messages.filter(
    (message) => message.content !== "" && message.messageId !== newBotMessage.messageId
  );
}
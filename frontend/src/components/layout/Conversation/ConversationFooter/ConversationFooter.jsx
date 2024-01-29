import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";
import { BeatLoader } from "react-spinners";
import hljs from 'highlight.js';

import { uploadFile, deleteFile } from "../../../../api/fileService";
import FileItem from './FileItem';
import { conversationShape } from "../../../../model/conversationPropType";
import { userShape } from "../../../../model/userPropType";

import "./ConversationFooter.scss";

const ConversationFooter = ({ user, currentConversation, setCurrentConversation,
  onSendMessage, onResendMessage, isStreaming, setIsStreaming, abortFetch, isWaitingForResponse, setError }) => {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [lastMessageRole, setLastMessageRole] = useState(null);
  const [fileList, setFileList] = useState([]);

  useEffect(() => {
    if (currentConversation?.messages?.length > 0) {
      setLastMessageRole(currentConversation.messages[currentConversation.messages.length - 1].role);
    }
  }, [currentConversation?.messages]);

  useEffect(() => {
    setError(null);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [input, setError]);


  const handleSend = useCallback(async () => {

    if (!currentConversation) return;
    const trimmedInput = input.trim();
    if (trimmedInput || fileList) {
      try {
        await onSendMessage(trimmedInput, fileList);
        setInput("");
        setFileList([]); // Clear file list after sending a message
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  }, [input, onSendMessage, currentConversation, fileList]);

  function handleAbort() {
    setIsStreaming(false);
    abortFetch();
  };

  function handleRetry() {
    const newMessages = [...currentConversation.messages.slice(0, -1)];
    setCurrentConversation(prevState => ({ ...prevState, messages: newMessages }));
    onResendMessage();
  };

  async function handlePaste() {
    try {
      const clipboardText = await navigator.clipboard.readText();

      // Use highlight.js to detect the language
      const detectedLanguage = hljs.highlightAuto(clipboardText);
      const language = detectedLanguage.language || 'plaintext';

      const formattedText = `\n\`\`\`${language}\n${clipboardText}\n\`\`\`\n`;

      const cursorPosition = textareaRef.current.selectionStart;
      const textBeforeCursor = input.substring(0, cursorPosition);
      const textAfterCursor = input.substring(cursorPosition);

      // Set the new input value
      setInput(textBeforeCursor + formattedText + textAfterCursor);

      // Use a timeout to ensure the DOM has updated before trying to set the selection range
      setTimeout(() => {
        // Focus the textarea and set the cursor to the end of the pasted text
        const textarea = textareaRef.current;
        if (textarea) {
          textarea.focus();
          const newPosition = (textBeforeCursor + formattedText).length;
          textarea.setSelectionRange(newPosition, newPosition);

          // Scroll the textarea to the cursor position
          textarea.scrollTop = textarea.scrollHeight;
        }
      }, 0);
    } catch (err) {
      console.error('Failed to read clipboard contents: ', err.message);
    }
  }

  const handleDeleteFile = useCallback((fileToDelete) => {
    if (!currentConversation?.userId) return;
    deleteFile(currentConversation.userId, fileToDelete.name)
    setFileList(fileList.filter(file => file.name !== fileToDelete.name));
  }, [fileList, currentConversation?.userId]);

  // Update handleFileChange function
  const handleFileChange = async (event) => {
    const fileName = event.target.files[0];
    if (fileName) {
      const fileDetails = await uploadFile(currentConversation.userId, fileName);
      setFileList(prevList => [...prevList, fileDetails.file]); // Add new file name to the list
    }
  }

  const handlePasteTimeoutRef = useRef(null); // Add a ref to store the timeout ID
  useEffect(() => {
    const timeoutId = handlePasteTimeoutRef.current;
    return () => {
      // Clear the timeout when the component unmounts
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  const BOT_ROLE = "bot";

  return (
    <div className="conversation-footer">

      <div className="top-footer-menu">
        {isStreaming || isWaitingForResponse ? (
          <button title={t("abort_title")} onClick={handleAbort}>{t("abort")}</button>
        ) : null}
        {!isStreaming && lastMessageRole === BOT_ROLE && (
          <button title={t("retry_title")} onClick={handleRetry}>
            {t("retry")}
          </button>
        )}
      </div>
      <div className="file-list">
        {fileList.map((file) => (
          <FileItem key={file.name} file={file} onDelete={handleDeleteFile} currentConversation={currentConversation} />
        ))}
      </div>
      <div className="footer-body" >
        <button
          title={t("attach_title")}
          onClick={() => fileInputRef?.current?.click()}
          disabled={isStreaming || !user?.settings?.model?.includes('vision')}
        >
          {t("attach")}
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={t("type_a_message")}
          rows={1}
          style={{ maxHeight: "100px" }}
          disabled={isStreaming}
        />
        <button
          title={t("send_title")}
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
        >
          {isStreaming ? <BeatLoader color="white" size="6px" /> : "➢"}
        </button>
        <div className="spacer" />
        <button
          title={t("paste_title")}
          onClick={handlePaste}
          disabled={isStreaming}
        >
          {t("paste")}
        </button>
        <input
          type="file"
          onChange={handleFileChange}
          disabled={isStreaming}
          style={{ display: 'none' }} // Hide the file input, but you can style it as needed
          ref={fileInputRef} // Add a ref to the file input
        />
      </div>
    </div>
  );
};

ConversationFooter.propTypes = {
  user: userShape.isRequired,
  currentConversation: conversationShape,
  setCurrentConversation: PropTypes.func.isRequired,
  onSendMessage: PropTypes.func.isRequired,
  onResendMessage: PropTypes.func.isRequired,
  isStreaming: PropTypes.bool.isRequired,
  setIsStreaming: PropTypes.func.isRequired,
  abortFetch: PropTypes.func.isRequired,
  isWaitingForResponse: PropTypes.bool.isRequired,
};
export default ConversationFooter;
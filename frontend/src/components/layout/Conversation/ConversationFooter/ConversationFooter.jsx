import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";
import { BeatLoader } from "react-spinners";
import hljs from 'highlight.js';

import { uploadFile, deleteFile } from "../../../../api/fileService";
import FileItem from './FileItem';
import { conversationShape } from "../../../../model/conversationPropType";
import { userShape } from "../../../../model/userPropType";
import { handleKeyDown as handleKeyDownUtility } from "../../../common/util/useTextareaKeyHandlers";
import {modelShape} from "../../../../model/modelPropType";
import SpeechToText from "./SpeechToText";

import "./ConversationFooter.scss";

const ConversationFooter = ({ user, currentConversation, setCurrentConversation,
  onSendMessage, onResendMessage, isStreaming, setIsStreaming, abortFetch, 
  isWaitingForResponse, setError, models }) => {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const [lastMessageRole, setLastMessageRole] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastHeight, setLastHeight] = useState('auto');

  const toggleHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      if (isExpanded) {
        // If currently expanded, reset to last known height
        textarea.style.height = lastHeight;
        setIsExpanded(false);
      } else {
        // If not expanded, expand to the full height of the screen
        setLastHeight(textarea.style.height); // Remember last height before expanding

        // Set height to the full height of the viewport
        let fullScreenHeight = `${window.innerHeight}px`;
        textarea.style.height = fullScreenHeight;
        setIsExpanded(true);
      }
    }
    focusOnTextArea();
  };
  useEffect(() => {
    setError(null);
    const textarea = textareaRef.current;
    if (textarea) {
      if (!isExpanded) {
        textarea.style.height = 'auto';
        let newHeight = `${Math.min(textarea.scrollHeight, 200)}px`;
        textarea.style.height = newHeight;
        setLastHeight(newHeight);
      } else {
        textarea.style.height = `${window.innerHeight}px`;
      }
    }
  }, [input, isExpanded, setError]); // Re-run whenever input or isExpanded changes


  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []); // The empty array means this effect runs once on mount

  const focusOnTextArea = () => {
    // Check if the ref is currently pointing to an element
    if (textareaRef.current) {
      // If so, focus the element
      textareaRef.current.focus();
    }
  };

  useEffect(() => {
    if (!isStreaming) {
      focusOnTextArea();
    }
  }, [isStreaming]);

  useEffect(() => {
    if (currentConversation?.messages?.length > 0) {
      setLastMessageRole(currentConversation.messages[currentConversation.messages.length - 1].role);
    }
  }, [currentConversation?.messages]);


  const handleSend = useCallback(async () => {

    if (!currentConversation) return;
    const trimmedInput = input.trim();
    if (trimmedInput || fileList) {
      try {
        await onSendMessage(trimmedInput, fileList, user.settings.model);
        focusOnTextArea();
        setInput("");
        setFileList([]); // Clear file list after sending a message
        setIsExpanded(false);
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    }
  }, [currentConversation, input, fileList, onSendMessage, user.settings.model]);

  function handleAbort() {
    setIsStreaming(false);
    abortFetch();
    focusOnTextArea();
  };

  async function handleRetry() {
    const newMessages = [...currentConversation.messages.slice(0, -1)];
    setCurrentConversation(prevState => ({ ...prevState, messages: newMessages }));
    await onResendMessage(user.settings.model);
    focusOnTextArea();
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
    focusOnTextArea();
  }, [fileList, currentConversation?.userId]);

  // Update handleFileChange function
  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }
    try {
      const fileDetails = await uploadFile(currentConversation.userId, file);
      setFileList(prevList => [...prevList, fileDetails.file]); // Add new file name to the list
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      // Reset the file input after handling the file change
      event.target.value = ''; // This line is crucial
    }
  }

  const handleKeyDown = useCallback((e) => {
    handleKeyDownUtility(e, setInput, input, textareaRef, user.settings.macros);
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [input, user.settings.macros, handleSend]);

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
  const doesModelSupportVision = (models, modelName) => {

    const model = models.find(m => m.name === modelName);
    if (!model) {
      return false;
    }
    return model.isSupportsVision;
  };

  const handleFileButtonClick = () => fileInputRef.current?.click();

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
          onClick={handleFileButtonClick}
          disabled={isStreaming || !doesModelSupportVision(models, user?.settings?.model)}
        >
          {t("attach")}
        </button>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("type_a_message")}
          rows={1}
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
        <button onClick={toggleHeight} title={t("toggle_height_title")}>
          {isExpanded ? t("expand") : t("shrink")}
        </button>
        <SpeechToText 
        isStreaming={isStreaming} 
        setInput={setInput}
        setError={setError}
        />  
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
  setError: PropTypes.func.isRequired,
  models: PropTypes.arrayOf(modelShape).isRequired,
};
export default ConversationFooter;

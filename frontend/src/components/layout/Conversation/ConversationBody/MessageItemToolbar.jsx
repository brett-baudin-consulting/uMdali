import React, {useCallback, useRef, useState} from 'react';
import { useTranslation } from 'react-i18next';
import PropTypes from 'prop-types';

import { convertTextToSpeech } from '../../../../api/textToSpeechModelService';
import { userShape } from "../../../../model/userPropType";

const pauseDuration = 600;

const MessageItemToolbar = ({
    onCopy,
    onDelete,
    onEdit,
    copied,
    isExpanded,
    lineCount,
    maxLineCount,
    message,
    user,
    setError,
    setIsExpanded,
  
}) => {
  const { t } = useTranslation();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const audioRef = useRef(null);

  const handleSpeakClick = useCallback(async () => {
    if (isSpeaking) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsSpeaking(false);
      return;
    }

    setError(null);
    setIsSpeaking(true);
    const textChunks = message.content.split('\n').filter(chunk => chunk.trim() !== '');

    // Function to convert text to speech and return a promise that resolves to the audio blob
    const convertChunkToSpeech = (chunk) => {
      const speech = convertTextToSpeech(
        user.settings.textToSpeechModel.model_id,
        chunk,
        user.settings.textToSpeechModel.voice_id,
        user.settings.textToSpeechModel.vendor
      );
      return speech;
    };

    // Function to play the audio blob
    const playAudioBlob = async (audioBlob) => {
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        URL.revokeObjectURL(audioRef.current.src); // Clean up previous audio object URL
      }
      audioRef.current = new Audio(audioUrl);

      return new Promise((resolve) => {
        audioRef.current.onended = () => resolve();
        audioRef.current.play().catch(err => console.error('Playback error:', err));
      });
    };

    // Asynchronously prefetch and play audio chunks
    const prefetchAndPlayChunks = async () => {
      try {
        if (textChunks.length === 0) {
          throw new Error('No text chunks to process');
        }

        let hasNextChunk = true;
        let nextChunkIndex = 0;
        let nextAudioBlobPromise = convertChunkToSpeech(textChunks[nextChunkIndex]);

        while (hasNextChunk) {
          const currentAudioBlobPromise = nextAudioBlobPromise;

          nextChunkIndex++;
          hasNextChunk = nextChunkIndex < textChunks.length;
          nextAudioBlobPromise = hasNextChunk ? convertChunkToSpeech(textChunks[nextChunkIndex]) : null;

          const audioBlob = await currentAudioBlobPromise; // Wait for the current audio blob
          await playAudioBlob(audioBlob); // Play current chunk

          // Wait for the specified pause duration before proceeding, unless it's the last chunk
          if (hasNextChunk) {
            await new Promise(resolve => setTimeout(resolve, pauseDuration));
          }
        }
      } catch (error) {
        setError(error.message); // Use setError here to handle the error
      } finally {
        setIsSpeaking(false); // Reset state when all chunks have been played or an error occurs
      }
    };

    prefetchAndPlayChunks().catch(error => {
      console.error('Error processing text to speech:', error);
      setIsSpeaking(false);
    });
  }, [isSpeaking, message.content, setError, user.settings.textToSpeechModel.model_id, user.settings.textToSpeechModel.vendor, user.settings.textToSpeechModel.voice_id]);
  const handleExpandClick = useCallback(() => {
    setIsExpanded(true);
  }, [setIsExpanded]);

  const handleShrinkClick = useCallback(() => {
    setIsExpanded(false);
  }, [setIsExpanded]);
  return (
    <div className="message-tool-bar">
      <button
        className="action-button"
        title={t('copy_to_clipboard_title')}
        onClick={onCopy}
      >
        {copied ? t('copied') : t('copy_to_clipboard')}
      </button>
      <button
        className="action-button"
        title={t('delete_title')}
        onClick={onDelete}
      >
        {t('delete')}
      </button>
      <button
        className="action-button"
        title={t('edit_title')}
        onClick={onEdit}
      >
        {t('edit')}
      </button>
      {!isExpanded && lineCount > maxLineCount && (
        <button className="action-button" onClick={handleExpandClick} title="Expand">
          ↓
        </button>
      )}
      {isExpanded && lineCount > maxLineCount && (
        <button className="action-button" onClick={handleShrinkClick} title="Shrink">
          ↑
        </button>
      )}
      <button
        className="action-button"
        title={isSpeaking ? t('stop_speaking_title') : t('speak_title')}
        onClick={handleSpeakClick}
      >
        {isSpeaking ? t('stop_speaking') : t('speak')}
      </button>
    </div>
  );
};
MessageItemToolbar.propTypes = {
    onCopy: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    copied: PropTypes.bool.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    lineCount: PropTypes.number.isRequired,
    maxLineCount: PropTypes.number.isRequired,
    message: PropTypes.object.isRequired,
    user: userShape.isRequired,
    setError: PropTypes.func.isRequired,
    setIsExpanded: PropTypes.func.isRequired,
  };
export default MessageItemToolbar;

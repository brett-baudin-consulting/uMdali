import { useState, useRef, useEffect, useCallback } from 'react';

const MAX_HEIGHT = 200;

export const useTextArea = (initialValue = '') => {
  const [value, setValue] = useState(initialValue);
  const textareaRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastHeight, setLastHeight] = useState('auto');

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto'; // Reset height before calculating

    const newHeight = isExpanded
      ? `${window.innerHeight}px`
      : `${Math.min(textarea.scrollHeight, MAX_HEIGHT)}px`;

    textarea.style.height = newHeight;

    if (!isExpanded) {
      setLastHeight(newHeight);
    }
  }, [isExpanded]);

  useEffect(() => {
    const handleResize = () => {
      if (isExpanded) {
        adjustHeight();
      }
    };

    window.addEventListener('resize', handleResize);
    adjustHeight();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    };
  }, [value, isExpanded, adjustHeight]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const handleChange = useCallback((e) => {
    setValue(e.target.value);
  }, []);

  return {
    value,
    setValue,
    textareaRef,
    isExpanded,
    toggleExpand,
    lastHeight,
    handleChange,
  };
};  
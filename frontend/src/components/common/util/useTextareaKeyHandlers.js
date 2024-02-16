// useTextareaKeyHandlers.js
export const handleKeyDown = (e, setInput, input, textareaRef, userMacros) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    // Logic to handle sending message could be invoked here.
  } else {
    let modifiers = "";
    if (e.ctrlKey || e.metaKey) modifiers += "ctrl+";
    if (e.shiftKey) modifiers += "shift+";
    if (e.altKey) modifiers += "alt+";

    // Normalize key names
    const keyName = e.key.toLowerCase().replace(/arrow/, '');
    const macroKey = `${modifiers}${keyName}`;

    const macro = userMacros.find(m => m.shortcut.toLowerCase() === macroKey);

    if (macro) {
      e.preventDefault();
      const macroText = macro.text;
      const cursorPosition = e.target.selectionStart;
      const textBeforeCursor = input.substring(0, cursorPosition);
      const textAfterCursor = input.substring(cursorPosition);

      setInput(textBeforeCursor + macroText + textAfterCursor);

      setTimeout(() => {
        const newPosition = cursorPosition + macroText.length;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  }
};
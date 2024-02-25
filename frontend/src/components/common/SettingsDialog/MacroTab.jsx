import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

import { userShape } from "../../../model/userPropType";
import { isShortcutAllowed } from "../util/shortcutValidator";
import "./MacroTab.scss";

function MacroTab({ user, setUser }) {
  const { t } = useTranslation();
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [macros, setMacros] = useState(() => user.settings.macros || []);

  useEffect(() => {
    setMacros(user.settings.macros);
  }, [user.settings.macros]);

  useEffect(() => {
    setUser((prevUser) => ({
      ...prevUser,
      settings: { ...prevUser.settings, macros },
    }));
  }, [macros, setUser]);

  const handleMacroChange = (index, key, value) => {

    const updatedMacros = macros.map((macro, idx) => {
      if (idx === index) {
        return { ...macro, [key]: value };
      }
      return macro;
    });
    setMacros(updatedMacros);
  };

  const handleAdd = () => {
    const newItem = {
      shortcut: "",
      text: "",
      macroId: `${uuidv4()}`,
    };
    setMacros([...macros, newItem]);
    setSelectedItemIndex(macros.length);
  };

  const handleDelete = () => {
    const updatedMacros = macros.filter((_, idx) => idx !== selectedItemIndex);
    setMacros(updatedMacros);

    // Adjust selectedItemIndex based on deletion context
    if (updatedMacros.length === 0) {
      // No items left, deselect
      setSelectedItemIndex(null);
    } else if (selectedItemIndex >= updatedMacros.length) {
      // If the last item or an out-of-range item was selected, adjust the index to the new last item
      setSelectedItemIndex(updatedMacros.length - 1);
    }
    // If an item before the currently selected one is deleted, selectedItemIndex is automatically adjusted by React's re-render
  };
  const handleShortcutValidation = (index, value) => {
    if (!isShortcutAllowed(value)) {
      alert(t('shortcutNotAllowed', { value }));

      // Set focus back to the input field using a more direct method
      setTimeout(() => { // Ensure this runs after the alert is dismissed
        document.querySelector(`input[data-index='${index}'][name='shortcut']`).focus();
      }, 0);
    }
  };
  return (
    <div className="macro-tab">
      <div className="content">
        <div className="left-panel">
          <ul className="list">
            {macros.map((macro, index) => (
              <li
                className={`list-item ${index === selectedItemIndex ? "active" : ""
                  }`}
                key={macro.macroId}
                onClick={() => setSelectedItemIndex(index)}
              >
                {macro.shortcut}
              </li>
            ))}
          </ul>
        </div>
        <div className="right-panel">
          {selectedItemIndex !== null && (
            <div className="input-container">
              <input
                type="text"
                data-index={selectedItemIndex} 
                name="shortcut" 
                value={macros[selectedItemIndex].shortcut}
                onChange={(e) =>
                  handleMacroChange(selectedItemIndex, "shortcut", e.target.value)
                }
                onBlur={(e) =>
                  handleShortcutValidation(selectedItemIndex, e.target.value)
                }
                placeholder={t('shortcut_placeholder')}
              />
              <textarea
                value={macros[selectedItemIndex].text}
                onChange={(e) =>
                  handleMacroChange(selectedItemIndex, "text", e.target.value)
                }
                placeholder={t('macro_placeholder')}
              />
            </div>
          )}
        </div>
      </div>
      <div className="footer">
        <button title={t('add_title')} onClick={handleAdd}>{t('add')}</button>
        <button
          title={t('delete_title')}
          onClick={handleDelete} disabled={selectedItemIndex === null}>
          {t('delete')}
        </button>
      </div>
    </div>
  );
}

MacroTab.propTypes = {
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
};

export default MacroTab;

import React, { useState, useEffect, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

import { userShape } from "../../../model/userPropType";
import { isShortcutAllowed } from "../util/shortcutValidator";

import "./MacroTab.scss";

function MacroTab({ user, setUser }) {
  const { t } = useTranslation();
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [macros, setMacros] = useState(() => user.settings.macros || []);

  const sortedMacros = useMemo(() =>
    [...macros].sort((a, b) => a.shortcut.localeCompare(b.shortcut)),
    [macros]
  );

  useEffect(() => {
    setMacros(user.settings.macros);
  }, [user.settings.macros]);

  useEffect(() => {
    if (sortedMacros.length > 0 && selectedItemId === null) {
      setSelectedItemId(sortedMacros[0].macroId);
    }
  }, [sortedMacros, selectedItemId]);

  useEffect(() => {
    setUser(prevUser => ({
      ...prevUser,
      settings: {
        ...prevUser.settings,
        macros: macros
      }
    }));
  }, [macros, setUser]);

  const handleMacroChange = useCallback((macro, key, value) => {
    setMacros(prevMacros => prevMacros.map((m) =>
      m.macroId === macro.macroId ? { ...m, [key]: value } : m
    ));
  }, []);

  const handleAdd = useCallback(() => {
    const newItem = {
      shortcut: "",
      text: "",
      macroId: uuidv4(),
    };
    setMacros(prevMacros => [newItem, ...prevMacros]);
    setSelectedItemId(newItem.macroId);
  }, []);

  const handleDelete = useCallback(() => {
    setMacros(prevMacros => {
      const updatedMacros = prevMacros.filter(macro => macro.macroId !== selectedItemId);
      setSelectedItemId(updatedMacros.length > 0 ? updatedMacros[0].macroId : null);
      return updatedMacros;
    });
  }, [selectedItemId]);

  const handleShortcutValidation = useCallback((macro, value) => {
    if (!isShortcutAllowed(value)) {
      alert(t('shortcutNotAllowed', { value }));
      // Using refs could be a better approach here instead of querying the DOM  
    }
  }, [t]);

  const selectedMacro = useMemo(() =>
    macros.find(macro => macro.macroId === selectedItemId),
    [macros, selectedItemId]
  );

  return (
    <div className="macro-tab">
      <div className="content">
        <div className="left-panel">
          <ul className="list">
            {sortedMacros.map((macro) => (
              <li
                className={`list-item ${macro.macroId === selectedItemId ? "active" : ""}`}
                key={macro.macroId}
                onClick={() => setSelectedItemId(macro.macroId)}
              >
                {macro.shortcut}
              </li>
            ))}
          </ul>
        </div>
        <div className="right-panel">
          {selectedMacro && (
            <div className="input-container">
              <input
                type="text"
                data-id={selectedMacro.macroId}
                name="shortcut"
                value={selectedMacro.shortcut || ""}
                onChange={(e) => handleMacroChange(selectedMacro, "shortcut", e.target.value)}
                onBlur={(e) => handleShortcutValidation(selectedMacro, e.target.value)}
                placeholder={t('shortcut_placeholder')}
              />
              <textarea
                value={selectedMacro.text || ""}
                onChange={(e) => handleMacroChange(selectedMacro, "text", e.target.value)}
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
          onClick={handleDelete} disabled={!selectedMacro}>
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
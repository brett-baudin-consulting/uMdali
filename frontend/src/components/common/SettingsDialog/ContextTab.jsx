import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

import { userShape } from "../../../model/userPropType";
import "./ContextTab.scss";

function ContextTab({ user, setUser }) {
  const { t } = useTranslation();
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [contexts, setContexts] = useState(user.settings.contexts);
  const [sortedContexts, setSortedContexts] = useState([]);

  useEffect(() => {
    setContexts(user.settings.contexts);
  }, [user.settings.contexts]);

  useEffect(() => {
    const sorted = [...contexts].sort((a, b) => a.name.localeCompare(b.name));
    setSortedContexts(sorted);
    // Select the first item if no item is currently selected and the list is not empty
    if (sorted.length > 0 && selectedItemId === null) {
      setSelectedItemId(sorted[0].contextId);
    }
  }, [contexts, selectedItemId]);

  const handleContextChange = (contextId, key, value) => {
    const updatedContexts = contexts.map((context) => {
      if (context.contextId === contextId) {
        return { ...context, [key]: value };
      }
      return context;
    });
    setContexts(updatedContexts);
    updateUserSettings(updatedContexts);
  };

  const updateUserSettings = (newContexts) => {
    setUser(prevUser => ({
      ...prevUser,
      settings: { ...prevUser.settings, contexts: newContexts },
    }));
  };

  const handleAdd = () => {
    const newItem = {
      name: "",
      text: "",
      contextId: `${uuidv4()}`,
    };
    const newContexts = [...contexts, newItem];
    setContexts(newContexts);
    setUser(prevUser => ({
      ...prevUser,
      settings: { ...prevUser.settings, contexts: newContexts },
    }));
    setSelectedItemId(newItem.contextId);
  };

  const handleDelete = () => {
    const updatedContexts = contexts.filter(
      context => context.contextId !== selectedItemId
    );
    setContexts(updatedContexts);
    setUser(prevUser => ({
      ...prevUser,
      settings: { ...prevUser.settings, contexts: updatedContexts },
    }));
    if (updatedContexts.length === 0) {
      setSelectedItemId(null);
    } else {
      setSelectedItemId(updatedContexts[0].contextId);
    }
  };

  return (
    <div className="context-tab">
      <div className="content">
        <div className="left-panel">
          <ul className="list">
            {sortedContexts.map((context) => (
              <li
                className={`list-item ${context.contextId === selectedItemId ? "active" : ""}`}
                key={context.contextId}
                onClick={() => setSelectedItemId(context.contextId)}
              >
                {context.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="right-panel">
          {selectedItemId !== null && (
            <div className="input-container">
              <input
                type="text"
                value={contexts.find(context => context.contextId === selectedItemId).name}
                onChange={(e) =>
                  handleContextChange(selectedItemId, "name", e.target.value)
                }
                placeholder={t("name_placeholder")}
              />
              <textarea
                value={contexts.find(context => context.contextId === selectedItemId).text}
                onChange={(e) =>
                  handleContextChange(selectedItemId, "text", e.target.value)
                }
                placeholder={t("context_placeholder")}
              />
            </div>
          )}
        </div>
      </div>
      <div className="footer">
        <button title={t("add_title")} onClick={handleAdd}>
          {t("add")}
        </button>
        <button
          title={t("delete_title")}
          onClick={handleDelete}
          disabled={selectedItemId === null}
        >
          {t("delete")}
        </button>
      </div>
    </div>
  );
}

ContextTab.propTypes = {
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
};

export default ContextTab;
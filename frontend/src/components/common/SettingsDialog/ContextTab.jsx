import React, { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useTranslation } from "react-i18next";
import { v4 as uuidv4 } from "uuid";

import { userShape } from "../../../model/userPropType";
import "./ContextTab.scss";

function ContextTab({ user, setUser }) {
  const { t } = useTranslation();
  const [selectedItemIndex, setSelectedItemIndex] = useState(null);
  const [contexts, setContexts] = useState(user.settings.contexts);

  useEffect(() => {
    setContexts(user.settings.contexts);
  }, [user.settings.contexts]);

  useEffect(() => {
    setUser((prevUser) => ({
      ...prevUser,
      settings: { ...prevUser.settings, contexts },
    }));
  }, [contexts, setUser]);

  const handleContextChange = (index, key, value) => {
    const updatedContexts = contexts.map((context, idx) => {
      if (idx === index) {
        return { ...context, [key]: value };
      }
      return context;
    });
    setContexts(updatedContexts);
  };

  const handleAdd = () => {
    const newItem = {
      name: "",
      text: "",
      contextId: `${uuidv4()}`,
    };
    setContexts([...contexts, newItem]);
    setSelectedItemIndex(contexts.length);
  };

  const handleDelete = () => {
    const updatedContexts = contexts.filter(
      (_, idx) => idx !== selectedItemIndex
    );
    setContexts(updatedContexts);
    setSelectedItemIndex(null);
  };

  return (
    <div className="context-tab">
      <div className="content">
        <div className="left-panel">
          <ul className="list">
            {contexts.map((context, index) => (
              <li
                className={`list-item ${index === selectedItemIndex ? "active" : ""
                  }`}
                key={context.contextId}
                onClick={() => setSelectedItemIndex(index)}
              >
                {context.name}
              </li>
            ))}
          </ul>
        </div>
        <div className="right-panel">
          {selectedItemIndex !== null && (
            <div className="input-container">
              <input
                type="text"
                value={contexts[selectedItemIndex].name}
                onChange={(e) =>
                  handleContextChange(selectedItemIndex, "name", e.target.value)
                }
                placeholder={t('name_placeholder')}
              />
              <textarea
                value={contexts[selectedItemIndex].text}
                onChange={(e) =>
                  handleContextChange(selectedItemIndex, "text", e.target.value)
                }
                placeholder={t('context_placeholder')}
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

ContextTab.propTypes = {
  user: userShape.isRequired,
  setUser: PropTypes.func.isRequired,
};

export default ContextTab;

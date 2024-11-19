import React from "react";  
import PropTypes from "prop-types";  

import { useTranslation } from "react-i18next";  
import { userShape } from "../../../model/userPropType";  
import { useContextManager } from "./useContextManager";  
import ContextListItem from "./ContextListItem";  

import "./ContextTab.scss";

function ContextTab({ user, setUser }) {  
  const { t } = useTranslation();  
    
  const updateUserSettings = (newContexts) => {  
    setUser(prevUser => ({  
      ...prevUser,  
      settings: { ...prevUser.settings, contexts: newContexts },  
    }));  
  };

  const {  
    contexts,  
    sortedContexts,  
    selectedItemId,  
    setSelectedItemId,  
    handleContextChange,  
    handleAdd,  
    handleDelete  
  } = useContextManager(user.settings.contexts, updateUserSettings);

  const selectedContext = contexts.find(context => context.contextId === selectedItemId);

  return (  
    <div className="context-tab">  
      <div className="content">  
        <div className="left-panel">  
          <ul className="list">  
            {sortedContexts.map((context) => (  
              <ContextListItem  
                key={context.contextId}  
                context={context}  
                isActive={context.contextId === selectedItemId}  
                onClick={() => setSelectedItemId(context.contextId)}  
              />  
            ))}  
          </ul>  
        </div>  
        <div className="right-panel">  
          {selectedContext && (  
            <div className="input-container">  
              <input  
                type="text"  
                value={selectedContext.name}  
                onChange={(e) =>  
                  handleContextChange(selectedItemId, "name", e.target.value)  
                }  
                placeholder={t("name_placeholder")}  
              />  
              <textarea  
                value={selectedContext.text}  
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
          disabled={!selectedItemId}  
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
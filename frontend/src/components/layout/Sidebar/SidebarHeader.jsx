import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';

import { userShape } from "../../../model/userPropType";

import './SidebarHeader.scss';

const SidebarHeader = ({
    searchText,
    setSearchText,
    handleSearchClick,
    createNewConversation,
    isSearchDisabled,
    user
}) => {
    const { t } = useTranslation();
    const [showOptions, setShowOptions] = useState(false);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        }
    };

    const handleNewConversationClick = () => {
        setShowOptions(!showOptions);
    };

    const handleOptionClick = (contextName) => {
        createNewConversation(contextName);
        setShowOptions(false);
    };

    return (
        <div className="sidebar-buttons">
            <div className="new-conversation-container">
                <button
                    title={t('new_conversation_title')}
                    className="new-conversation-btn"
                    onClick={handleNewConversationClick}
                >
                    {t("new_conversation")}
                </button>
                {showOptions && (
                    <ul className="new-conversation-options">
                        {user.settings.contexts.map((context) => (
                            <li key={context.name} onClick={() => handleOptionClick(context.name)}>
                                {context.name}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <input
                type="text"
                className="search-input"
                placeholder={t('search_placeholder')}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button
                title={t('search_title')}
                className="search-btn"
                disabled={isSearchDisabled}
                onClick={handleSearchClick}
            >
                {t('search')}
            </button>
        </div>
    );
};

SidebarHeader.propTypes = {
    searchText: PropTypes.string.isRequired,
    setSearchText: PropTypes.func.isRequired,
    handleSearchClick: PropTypes.func.isRequired,
    createNewConversation: PropTypes.func.isRequired,
    isSearchDisabled: PropTypes.bool.isRequired,
    user: userShape.isRequired
};

export default SidebarHeader;
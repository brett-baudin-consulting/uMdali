import React, { useState, useRef, useEffect } from 'react';
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
    user,
    setIsWizardVisible
}) => {
    const { t } = useTranslation();
    const [showInitialOptions, setShowInitialOptions] = useState(false);
    const [showUserContexts, setShowUserContexts] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                // Close the appropriate menu based on which one is currently open
                if (showInitialOptions) setShowInitialOptions(false);
                if (showUserContexts) setShowUserContexts(false);
            }
        }

        // Add event listener when either menu is visible
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            // Cleanup the event listener when the component unmounts or states change
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showInitialOptions, showUserContexts]);

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearchClick();
        }
    };

    const handleNewConversationClick = () => {
        setShowInitialOptions(!showInitialOptions);
        setShowUserContexts(false); // Reset the display of user contexts
    };

    const handleInitialOptionClick = (option) => {
        if (option === t('ai_human_convesation_title')) {
            setShowUserContexts(true);
        } else if (option === t('ai_ai_conversation_title')) {
            setShowUserContexts(false);
            setIsWizardVisible(true);
        }
        setShowInitialOptions(false); // Hide initial options after selection
    };

    const handleOptionClick = (contextName) => {
        createNewConversation(contextName);
        setShowUserContexts(false);
    };

    return (
        <div className="sidebar-buttons" ref={containerRef}>
            <div className="new-conversation-container">
                <button
                    title={t('new_conversation_title')}
                    className="new-conversation-btn"
                    onClick={handleNewConversationClick}
                >
                    {t("new_conversation")}
                </button>
                {showInitialOptions && (
                    <ul className="new-conversation-options">
                        <li onClick={() => handleInitialOptionClick(t('ai_human_convesation_title'))}>
                            {t('ai_human_convesation_title')}
                        </li>
                        <li onClick={() => handleInitialOptionClick(t('ai_ai_conversation_title'))}>
                            {t('ai_ai_conversation_title')}
                        </li>
                    </ul>
                )}
                {showUserContexts && (
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
    user: userShape.isRequired,
    setIsWizardVisible: PropTypes.func.isRequired,
};

export default SidebarHeader;
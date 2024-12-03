import React, { useCallback } from 'react';  
import PropTypes from 'prop-types';  
import { useTranslation } from 'react-i18next';  
import { userShape } from '../../../model/userPropType';  
import DropdownMenu from './DropdownMenu';  
import useClickOutside from './hooks/useClickOutside';  
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
    const [showInitialOptions, setShowInitialOptions, containerRef] = useClickOutside();  
    const [showUserContexts, setShowUserContexts] = useClickOutside();

    const initialOptions = [  
        { id: 'human', label: t('ai_human_conversation_title') },  
        { id: 'ai', label: t('ai_ai_conversation_title') }  
    ];

    const handleKeyDown = useCallback((e) => {  
        if (e.key === 'Enter' && !isSearchDisabled) {  
            handleSearchClick();  
        }  
    }, [handleSearchClick, isSearchDisabled]);

    const handleNewConversationClick = useCallback(() => {  
        setShowInitialOptions(prev => !prev);  
        setShowUserContexts(false);  
    }, [setShowInitialOptions, setShowUserContexts]);

    const handleInitialOptionClick = useCallback((optionId) => {  
        if (optionId === 'human') {  
            setShowUserContexts(true);  
        } else if (optionId === 'ai') {  
            setIsWizardVisible(true);  
        }  
        setShowInitialOptions(false);  
    }, [setIsWizardVisible, setShowUserContexts, setShowInitialOptions]);

    const handleContextClick = useCallback((contextName) => {  
        createNewConversation(contextName);  
        setShowUserContexts(false);  
    }, [createNewConversation, setShowUserContexts]);

    const sortedContexts = React.useMemo(() =>   
        [...user.settings.contexts].sort((a, b) => a.name.localeCompare(b.name)),  
        [user.settings.contexts]  
    );

    return (  
        <div className="sidebar-buttons" ref={containerRef}>  
            <div className="new-conversation-container">  
                <button  
                    aria-label={t('new_conversation_title')}  
                    className="new-conversation-btn"  
                    onClick={handleNewConversationClick}  
                >  
                    {t('new_conversation')}  
                </button>  
                  
                {showInitialOptions && (  
                    <DropdownMenu  
                        items={initialOptions}  
                        onSelect={handleInitialOptionClick}  
                    />  
                )}  
                  
                {showUserContexts && (  
                    <DropdownMenu  
                        items={sortedContexts.map(context => ({  
                            id: context.name,  
                            label: context.name  
                        }))}  
                        onSelect={handleContextClick}  
                    />  
                )}  
            </div>

            <input  
                type="text"  
                className="sidebar-buttons__search"  
                placeholder={t('search_placeholder')}  
                value={searchText}  
                onChange={(e) => setSearchText(e.target.value)}  
                onKeyDown={handleKeyDown}  
                aria-label={t('search_placeholder')}  
            />

            <button  
                aria-label={t('search_title')}  
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
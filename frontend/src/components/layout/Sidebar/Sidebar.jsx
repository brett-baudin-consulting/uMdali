import React, { useState, useEffect, useMemo, useCallback } from "react";
import PropTypes from "prop-types";

import ConversationItem from "./ConversationItem";
import { conversationShape } from "../../../model/conversationPropType";
import { userShape } from "../../../model/userPropType";
import {
  searchConversations,
  deleteConversation as deleteConversationApi,
  updateConversation as updateConversationApi
} from "../../../api/conversationService";
import SidebarHeader from "./SidebarHeader";

import "./Sidebar.scss";

const Sidebar = ({
  conversations,
  currentConversation,
  setCurrentConversation,
  setConversations,
  createNewConversation,
  user
}) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const reversedConversations = useMemo(() => {
    return [...conversations].reverse();
  }, [conversations]);

  useEffect(() => {
    if (searchText.trim() === '') {
      setSearchResults(null);
    }
  }, [searchText]);

  const handleSearch = useCallback(async () => {
    const trimmedSearchText = searchText.trim();
    if (trimmedSearchText) {
      try {
        const res = await searchConversations(trimmedSearchText);
        const mappedResults = res.map(id => conversations.find(
          conversation => conversation.conversationId === id));
        setSearchResults(mappedResults.reverse());
      } catch (err) {
        console.error(err);
      }
    }
  }, [searchText, conversations]);

  const deleteConversation = useCallback(async (conversationId) => {
    try {
      setConversations(prev => {
        // Filter out the deleted conversation
        const updatedConversations = prev.filter(c => c.conversationId !== conversationId);
  
        // If the currentConversation is the one being deleted, update the currentConversation
        if (currentConversation?.conversationId === conversationId) {
          const currentIndex = prev.findIndex(c => c.conversationId === conversationId);
  
          // Set to next item if available, else previous, else null
          const nextCurrent = updatedConversations[currentIndex] 
                               || updatedConversations[currentIndex - 1] 
                               || null;
          setCurrentConversation(nextCurrent);
        }
  
        return updatedConversations;
      });
      await deleteConversationApi(conversationId);
    } catch (err) {
      console.error(err);
    }
  }, [currentConversation, setConversations, setCurrentConversation]);
  
  const updateConversation = useCallback(async (updatedConversation) => {
    try {
      await updateConversationApi(updatedConversation);
      setConversations(prev =>
        prev.map(c =>
          c.conversationId === updatedConversation.conversationId
            ? updatedConversation
            : c
        )
      );
    } catch (err) {
      console.error(err);
    }
  }, [setConversations]);

  const handleClick = (conversation) => {
    setCurrentConversation(conversation);
  };

  const renderConversationList = (conversationsList) => (
    conversationsList.map((conversation) => (
      <li
        key={conversation.conversationId}
        className={`conversation-list-item ${conversation.conversationId === currentConversation?.conversationId
          ? "selected"
          : ""
          }`}
        onClick={() => handleClick(conversation)}
      >
        <ConversationItem
          conversation={conversation}
          deleteConversation={deleteConversation}
          updateConversation={updateConversation}
          isSelected={
            conversation.conversationId === currentConversation?.conversationId
          }
          user={user}
        />
      </li>
    ))
  );

  return (
    <div className="sidebar">
      <SidebarHeader
        searchText={searchText}
        setSearchText={setSearchText}
        handleSearchClick={handleSearch}
        createNewConversation={createNewConversation}
        isSearchDisabled={conversations.length === 0 || searchText.trim() === ''}
        user={user}
      />
      <div className="conversation-list-container">
        <ul className="conversation-list">
          {searchResults
            ? renderConversationList(searchResults)
            : renderConversationList(reversedConversations)}
        </ul>
      </div>
    </div>
  );
};

Sidebar.propTypes = {
  conversations: PropTypes.arrayOf(conversationShape),
  currentConversation: conversationShape,
  setCurrentConversation: PropTypes.func.isRequired,
  setConversations: PropTypes.func.isRequired,
  createNewConversation: PropTypes.func.isRequired,
  user: userShape.isRequired
};

export default Sidebar;
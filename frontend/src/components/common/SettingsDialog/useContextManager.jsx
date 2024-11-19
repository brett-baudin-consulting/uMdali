import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export function useContextManager(initialContexts, updateUser) {
  const [contexts, setContexts] = useState(initialContexts);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [sortedContexts, setSortedContexts] = useState([]);

  useEffect(() => {
    setContexts(initialContexts);
  }, [initialContexts]);

  useEffect(() => {
    const sorted = [...contexts].sort((a, b) => a.name.localeCompare(b.name));
    setSortedContexts(sorted);
    if (sorted.length > 0 && selectedItemId === null) {
      setSelectedItemId(sorted[0].contextId);
    }
  }, [contexts, selectedItemId]);

  const handleContextChange = (contextId, key, value) => {
    const updatedContexts = contexts.map((context) =>
      context.contextId === contextId ? { ...context, [key]: value } : context
    );
    setContexts(updatedContexts);
    updateUser(updatedContexts);
  };

  const handleAdd = () => {
    const newItem = {
      name: "",
      text: "",
      contextId: uuidv4()
    };
    const newContexts = [...contexts, newItem];
    setContexts(newContexts);
    updateUser(newContexts);
    setSelectedItemId(newItem.contextId);
  };

  const handleDelete = () => {
    const updatedContexts = contexts.filter(
      context => context.contextId !== selectedItemId
    );
    setContexts(updatedContexts);
    updateUser(updatedContexts);
    setSelectedItemId(updatedContexts.length ? updatedContexts[0].contextId : null);
  };

  return {
    contexts,
    sortedContexts,
    selectedItemId,
    setSelectedItemId,
    handleContextChange,
    handleAdd,
    handleDelete
  };
}  
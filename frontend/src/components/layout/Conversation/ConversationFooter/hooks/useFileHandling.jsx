// hooks/useFileHandling.jsx  
import { useCallback } from 'react';
import { deleteFile } from "../../../../../api/fileService";

const ACCEPTED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'audio/mpeg', 'video/mp4'];

export const useFileHandling = (currentConversation, setError, handleUpload, setFileList) => {
    const validateFile = useCallback((file) => {
        if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
            throw new Error('File type not supported');
        }
        return true;
    }, []);

    const handleDeleteFile = useCallback((fileToDelete) => {
        if (!currentConversation?.userId) return;

        deleteFile(currentConversation.userId, fileToDelete.name)
            .catch(error => {
                setError(error);
                console.error("Failed to delete file:", error);
            });
        setFileList(prev => prev.filter(file => file.name !== fileToDelete.name));
    }, [currentConversation?.userId, setFileList, setError]);

    const handleFileChange = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            validateFile(file);
            await handleUpload(file);
        } catch (error) {
            setError(error);
            console.error("Failed to upload file:", error);
        } finally {
            event.target.value = '';
        }
    }, [handleUpload, setError, validateFile]);

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            try {
                validateFile(files[0]);
                handleUpload(files[0]).catch(error => {
                    setError(error);
                    console.error("Failed to upload dropped file:", error);
                });
            } catch (error) {
                setError(error);
            }
        }
        return false;
    }, [handleUpload, setError, validateFile]);

    return {
        validateFile,
        handleDeleteFile,
        handleFileChange,
        handleDrop
    };
};  
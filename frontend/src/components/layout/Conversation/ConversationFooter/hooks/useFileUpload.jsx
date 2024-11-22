import { useCallback, useState } from 'react';  
import { uploadFile } from '../../../../../api/fileService';

export const useFileUpload = (conversationId, onError) => {  
  const [fileList, setFileList] = useState([]);  
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = useCallback(async (file) => {  
    if (!conversationId) {  
      onError?.(new Error('No conversation ID provided'));  
      return;  
    }

    setIsUploading(true);  
    try {  
      const fileDetails = await uploadFile(conversationId, file);  
      setFileList(prev => [...prev, fileDetails.file]);  
    } catch (error) {  
      onError?.(error);  
      console.error('Upload failed:', error);  
    } finally {  
      setIsUploading(false);  
    }  
  }, [conversationId, onError]);

  return {  
    fileList,  
    setFileList,  
    handleUpload,  
    isUploading  
  };  
};  
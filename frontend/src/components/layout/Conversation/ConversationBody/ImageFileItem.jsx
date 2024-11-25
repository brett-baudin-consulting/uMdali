// ImageFileItem.jsx  
import React, { useState, useEffect } from 'react';  
import { conversationShape, fileShape } from "../../../../model/conversationPropType";  
import { fetchImageFile } from "../../../../api/fileService";

const ImageFileItem = ({ file, currentConversation }) => {  
    const [imageFileUrl, setImageFileUrl] = useState('');  
    const [error, setError] = useState(null);

    useEffect(() => {  
        let isMounted = true;

        const fetchImage = async () => {  
            if (!currentConversation?.userId || !file) return;

            try {  
                const imageUrl = await fetchImageFile(currentConversation.userId, file);  
                if (isMounted) {  
                    setImageFileUrl(imageUrl);  
                }  
            } catch (err) {  
                if (isMounted) {  
                    setError('Failed to load image');  
                    console.error('Failed to fetch file icon:', err);  
                }  
            }  
        };

        fetchImage();

        return () => {  
            isMounted = false;  
        };  
    }, [file, currentConversation?.userId]);

    if (error) {  
        return <div className="image-file-item image-file-item--error">{error}</div>;  
    }

    return (  
        <div className="image-file-item">  
            <div className="image-file-item-content">  
                {imageFileUrl ? (  
                    <img   
                        src={imageFileUrl}   
                        alt={file.originalName}   
                        title={file.originalName}  
                        loading="lazy"  
                    />  
                ) : (  
                    <div className="image-file-item-loading">Loading...</div>  
                )}  
            </div>  
        </div>  
    );  
};

ImageFileItem.propTypes = {  
    file: fileShape.isRequired,  
    currentConversation: conversationShape.isRequired,  
};

export default ImageFileItem;  
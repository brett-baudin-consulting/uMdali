import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";

import { conversationShape, fileShape } from "../../../../model/conversationPropType";
import { fetchImageFile } from "../../../../api/fileService";

import './ImageFileItem.scss';

const ImageFileItem = ({ file, currentConversation }) => {
    const { t } = useTranslation();

    const [imageFileUrl, setImageFileUrl] = useState('');

    useEffect(() => {
        if (currentConversation?.userId && file) {
            const fetchImage = async () => {
                try {
                    const icon = await fetchImageFile(currentConversation.userId, file);
                    setImageFileUrl(icon);
                } catch (error) {
                    console.error('Failed to fetch file icon:', error);
                }
            };

            fetchImage();
        }
    }, [file]);

    return (
        <div className="image-file-item">
            <div className="image-file-item-content">
                <img src={imageFileUrl} alt={file.originalName} title={file.originalName} />
            </div>
        </div>
    );
};

ImageFileItem.propTypes = {
    file: fileShape.isRequired,
    currentConversation: conversationShape.isRequired,
};

export default ImageFileItem;
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { conversationShape, fileShape } from "../../../../model/conversationPropType";
import { fetchIcon } from "../../../../api/fileService";

import './FileItem.scss';

const FileItem = ({ file, onDelete, currentConversation }) => {
    const [iconUrl, setIconUrl] = useState('');

    useEffect(() => {
        if (currentConversation?.userId) {
            const fetchFileIcon = async () => {
                try {
                    const icon = await fetchIcon(currentConversation.userId, file.name);
                    setIconUrl(icon);
                } catch (error) {
                    console.error('Failed to fetch file icon:', error);
                }
            };

            fetchFileIcon();
        }
    }, [currentConversation?.userId, file.name]);

    return (
        <div className="file-item">
            <div className="file-item-content">
                <img src={iconUrl} alt={file.originalName} title={file.originalName} />
                <button
                    className="delete-button"
                    onClick={() => onDelete(file)}
                    aria-label={`Delete ${file.originalName}`}
                >
                    x
                </button>
            </div>
        </div>
    );
};

FileItem.propTypes = {
    file: fileShape.isRequired,
    onDelete: PropTypes.func.isRequired,
    currentConversation: conversationShape.isRequired,
};

export default FileItem;
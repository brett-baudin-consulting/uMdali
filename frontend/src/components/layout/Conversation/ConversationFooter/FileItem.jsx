import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from "react-i18next";

import { conversationShape, fileShape } from "../../../../model/conversationPropType";
import { fetchIcon } from "../../../../api/fileService";

import './FileItem.scss';

const FileItem = ({ file, onDelete, currentConversation }) => {
    const { t } = useTranslation();

    const [iconUrl, setIconUrl] = useState('');

    useEffect(() => {
        if (currentConversation?.userId) {
            const fetchFileIcon = async () => {
                try {
                    const icon = await fetchIcon(currentConversation.userId, file);
                    setIconUrl(icon);
                } catch (error) {
                    console.error('Failed to fetch file icon:', error);
                }
            };

            fetchFileIcon();
        }
    }, [currentConversation.userId, file, file.name]);

    return (
        <div className="file-item">
            <div className="file-item-content">
                <img src={iconUrl} alt={file.originalName} title={file.originalName} />
                <button
                    className="delete-button"
                    onClick={() => onDelete(file)}
                    title={t('delete_title')}
                    aria-label={`Delete ${file.originalName}`}
                >
                    {t('delete')}
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
import React from 'react';
import PropTypes from 'prop-types';
import TextareaAutosize from 'react-textarea-autosize';
import ImageFileItem from './ImageFileItem';
import MarkdownLatexParser from './MarkdownLatexParser';
import { messageShape, conversationShape } from '../../../../model/conversationPropType';

function MessageContent({
    message,
    isEditing,
    editedMessage,
    isExpanded,
    textareaRef,
    onEditChange,
    onEditConfirm,
    currentConversation,
    onDeleteFile,
    isDeleting
}) {
    return (
        <>
            <div className="message-item__files">
                {message?.files?.map((file) => (
                    <ImageFileItem
                        key={file.name}
                        file={file}
                        currentConversation={currentConversation}
                        onDelete={() => onDeleteFile(file)}
                        isDeleting={isDeleting}
                    />
                ))}
            </div>
            <div className={`message-item__content ${!isExpanded ? 'message-item__content--shrink' : ''}`}>
                {isEditing ? (
                    <TextareaAutosize
                        className="message-item__edit"
                        value={editedMessage}
                        onChange={(e) => onEditChange(e.target.value)}
                        onBlur={onEditConfirm}
                        autoFocus
                        ref={textareaRef}
                    />
                ) : (
                    <MarkdownLatexParser content={message.content} />
                )}
            </div>
        </>
    );
}

MessageContent.propTypes = {
    message: messageShape.isRequired,
    isEditing: PropTypes.bool.isRequired,
    editedMessage: PropTypes.string.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    textareaRef: PropTypes.object.isRequired,
    onEditChange: PropTypes.func.isRequired,
    onEditConfirm: PropTypes.func.isRequired,
    currentConversation: conversationShape.isRequired,
    onDeleteFile: PropTypes.func.isRequired,
    isDeleting: PropTypes.bool.isRequired,
};

export default React.memo(MessageContent);  
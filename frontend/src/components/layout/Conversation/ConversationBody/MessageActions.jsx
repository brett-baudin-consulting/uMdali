import React from 'react';
import PropTypes from 'prop-types';
import { CONSTANTS } from './constants';

function MessageActions({
    copied,
    isSpeaking,
    isExpanded,
    lineCount,
    onCopy,
    onDelete,
    onEdit,
    onExpand,
    onShrink,
    onSpeak,
    t
}) {
    return (
        <div className="message-item__actions">
            <div className="message-item__toolbar">
                <button
                    className="message-item__button"
                    title={t('copy_to_clipboard_title')}
                    onClick={onCopy}
                >
                    {copied ? t('copied') : t('copy_to_clipboard')}
                </button>
                <button
                    className="message-item__button"
                    title={t('delete_title')}
                    onClick={onDelete}
                >
                    {t('delete')}
                </button>
                <button
                    className="message-item__button"
                    title={t('edit_title')}
                    onClick={onEdit}
                >
                    {t('edit')}
                </button>
                {!isExpanded && lineCount > CONSTANTS.MAX_LINE_COUNT && (
                    <button
                        className="message-item__button"
                        onClick={onExpand}
                        title="Expand"
                    >
                        ↓
                    </button>
                )}
                {isExpanded && lineCount > CONSTANTS.MAX_LINE_COUNT && (
                    <button
                        className="message-item__button"
                        onClick={onShrink}
                        title="Shrink"
                    >
                        ↑
                    </button>
                )}
                <button
                    className="message-item__button"
                    title={isSpeaking ? t('stop_speaking_title') : t('speak_title')}
                    onClick={onSpeak}
                >
                    {isSpeaking ? t('stop_speaking') : t('speak')}
                </button>
            </div>
        </div>
    );
}

MessageActions.propTypes = {
    copied: PropTypes.bool.isRequired,
    isSpeaking: PropTypes.bool.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    lineCount: PropTypes.number.isRequired,
    onCopy: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onExpand: PropTypes.func.isRequired,
    onShrink: PropTypes.func.isRequired,
    onSpeak: PropTypes.func.isRequired,
    t: PropTypes.func.isRequired,
};

export default React.memo(MessageActions);  
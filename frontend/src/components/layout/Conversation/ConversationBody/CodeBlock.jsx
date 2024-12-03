// CodeBlock.jsx  
import React, { useState, useCallback, memo } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './CodeBlock.scss';

const CodeBlock = ({ language = 'text', value }) => {
    const [isCopied, setIsCopied] = useState(false);
    const { t } = useTranslation();

    const handleCopy = useCallback(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    }, []);

    return (
        <div className="code-block">
            <div className="code-block__header">
                <span className="code-block__language">{language}</span>
                <CopyToClipboard text={value} onCopy={handleCopy}>
                    <button
                        type="button"
                        className="code-block__copy-button"
                        title={t('copy_to_clipboard_title')}
                        aria-label={t('copy_to_clipboard_title')}
                    >
                        {isCopied ? t('copied') : t('copy_to_clipboard')}
                    </button>
                </CopyToClipboard>
            </div>
            <div className="code-block__content">
                <SyntaxHighlighter
                    language={language}
                    style={solarizedlight}
                    customStyle={{ margin: 0 }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

CodeBlock.propTypes = {
    language: PropTypes.string,
    value: PropTypes.string.isRequired,
};

export default memo(CodeBlock);  
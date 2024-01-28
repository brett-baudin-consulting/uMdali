import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import './CodeBlock.scss';

const CodeBlock = ({ language, value }) => {
    const [isCopied, setIsCopied] = useState(false);
    const { t } = useTranslation();
    const timerRef = useRef(null);

    const onCopy = useCallback(() => {
        setIsCopied(true);
    }, []);

    useEffect(() => {
        if (!isCopied) return;

        timerRef.current = setTimeout(() => setIsCopied(false), 2000);
        return () => clearTimeout(timerRef.current);
    }, [isCopied]);

    return (
        <div className="code-block-container">
            <div className="code-block-header">
                <span>{language}</span>
                <CopyToClipboard text={value} onCopy={onCopy}>
                    <button
                        className="copy-code-button"
                        title={t("copy_to_clipboard_title")}
                        aria-label={t("copy_to_clipboard_title")}
                        data-testid="copy-button"
                    >
                        {isCopied ? t("copied") : t("copy_to_clipboard")}
                    </button>
                </CopyToClipboard>
            </div>
            <SyntaxHighlighter
                language={language}
                style={solarizedlight}
                className="syntax-highlighter-custom"
            >
                {value}
            </SyntaxHighlighter>
        </div>
    );
};

CodeBlock.propTypes = {
    language: PropTypes.string,
    value: PropTypes.string.isRequired,
};

CodeBlock.defaultProps = {
    language: 'text',
};

export default memo(CodeBlock);
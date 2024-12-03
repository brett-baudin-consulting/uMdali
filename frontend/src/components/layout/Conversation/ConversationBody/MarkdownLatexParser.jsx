// components/MarkdownLatexParser.jsx  
import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeKatex from 'rehype-katex';
import remarkMath from 'remark-math';
import gfm from 'remark-gfm';
import PropTypes from 'prop-types';
import 'katex/dist/katex.min.css';

import CodeBlock from './CodeBlock';
import { convertDelimiters } from './markdownConverter';
import './MarkdownLatexParser.scss';

const MarkdownLatexParser = ({ content = '' }) => {
  const processedContent = useMemo(() => convertDelimiters(content), [content]);

  const components = useMemo(() => ({
    code: ({ node, inline, className, children, ...props }) => {
      const match = /language-(\w+)/.exec(className || '');

      return !inline && match ? (
        <CodeBlock
          value={String(children).replace(/\n$/, '')}
          language={match[1]}
          {...props}
        />
      ) : (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
  }), []);

  if (!content) {
    return <div className="markdown-empty" aria-hidden="true" />;
  }

  return (
    <div className="markdown-container">
      <ReactMarkdown
        components={components}
        remarkPlugins={[remarkMath, gfm]}
        rehypePlugins={[rehypeKatex]}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

MarkdownLatexParser.propTypes = {
  content: PropTypes.string,
};

export default React.memo(MarkdownLatexParser);  
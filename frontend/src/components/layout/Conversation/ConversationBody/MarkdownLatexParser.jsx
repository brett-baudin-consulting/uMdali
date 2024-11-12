// MarkdownLatexParser.js  
import React, { useMemo } from 'react';  
import ReactMarkdown from 'react-markdown';  
import rehypeKatex from 'rehype-katex';  
import remarkMath from 'remark-math';  
import gfm from 'remark-gfm';  
import 'katex/dist/katex.min.css';  
import PropTypes from 'prop-types';

import CodeBlock from './CodeBlock';  
import './MarkdownLatexParser.scss';

const convertDelimiters = (text) => {  
  // Convert block delimiters \[...\] to $$...$$    
  const blockRegex = /\\\[(.*?)\\\]/gs;  
  const convertedBlockText = text.replace(blockRegex, (_, innerContent) =>   
    `$$${innerContent}$$`  
  );

  // Convert inline delimiters \(...\) to $...$    
  const inlineRegex = /\\\((.*?)\\\)/gs;  
  return convertedBlockText.replace(inlineRegex, (_, innerContent) =>   
    `$${innerContent}$`  
  );  
};

const MarkdownLatexParser = ({ content = '' }) => {  
  const processedContent = useMemo(() => {  
    if (!content) return '';  
    return convertDelimiters(content.replace(/(?<!\n)\n(?!\n)/g, '  \n'));  
  }, [content]);

  const components = useMemo(() => ({  
    code: ({ node, inline, className, children, ...props }) => {  
      const match = /language-(\w+)/.exec(className || '');  
        
      if (!inline && match) {  
        return (  
          <CodeBlock  
            value={String(children).replace(/\n$/, '')}  
            language={match[1]}  
            {...props}  
          />  
        );  
      }  
        
      return (  
        <code className={className} {...props}>  
          {children}  
        </code>  
      );  
    },  
  }), []);

  if (!content) {  
    return <div className="markdown-empty" />;  
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

export default MarkdownLatexParser;  
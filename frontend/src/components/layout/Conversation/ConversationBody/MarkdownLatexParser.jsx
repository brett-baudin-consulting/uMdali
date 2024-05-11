import React, { useMemo } from 'react';  
import ReactMarkdown from 'react-markdown';  
import rehypeKatex from 'rehype-katex';  
import remarkMath from 'remark-math';  
import gfm from 'remark-gfm';  
import 'katex/dist/katex.min.css';

import CodeBlock from './CodeBlock';

const MarkdownLatexParser = ({ content }) => {  
    const renderers = useMemo(() => ({  
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
        return <div>No content provided.</div>;  
    }

    return (  
        <ReactMarkdown  
            components={renderers}  
            remarkPlugins={[remarkMath, gfm]}  
            rehypePlugins={[rehypeKatex]}  
        >  
            {content}  
        </ReactMarkdown>  
    );  
};

export default MarkdownLatexParser;  
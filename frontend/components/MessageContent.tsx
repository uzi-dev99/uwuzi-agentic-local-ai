import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import FileIcon from './icons/FileIcon';

interface MessageContentProps {
  content: string;
}

const isImageDataUrl = (content: string) => content.startsWith('data:image');
const fileAttachmentRegex = /^\(File Attached: (.*?)\)\n*(.*)$/s;

const MessageContent: React.FC<MessageContentProps> = ({ content }) => {
  if (isImageDataUrl(content)) {
    return (
      <div className="p-2">
        <img
          src={content}
          alt="User upload"
          className="max-w-xs max-h-64 rounded-lg object-contain"
        />
      </div>
    );
  }
  
  const fileAttachmentMatch = content.match(fileAttachmentRegex);
  if (fileAttachmentMatch) {
      const [, fileName, restOfMessage] = fileAttachmentMatch;

      return (
        <div className="text-light space-y-2">
          <div className="bg-primary/50 p-3 rounded-lg flex items-center gap-3">
              <FileIcon className="w-6 h-6 text-muted flex-shrink-0"/>
              <span className="font-mono text-sm truncate">{fileName}</span>
          </div>
          {restOfMessage && (
            <div className="prose prose-invert prose-sm text-light">
               <ReactMarkdown>{restOfMessage}</ReactMarkdown>
            </div>
          )}
        </div>
      );
  }

  return (
    <div
      className={`prose prose-invert prose-sm text-light`}
    >
      <ReactMarkdown
        components={{
          code({ node, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <SyntaxHighlighter
                  style={atomDark as any}
                  language={match[1]}
                  PreTag="div"
                  customStyle={{
                    margin: 0,
                    padding: '12px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    lineHeight: '1.4',
                    overflowX: 'auto',
                    maxWidth: '100%',
                    whiteSpace: 'pre',
                    wordBreak: 'normal',
                  }}
                  codeTagProps={{
                    style: {
                      whiteSpace: 'pre',
                      wordBreak: 'normal',
                      display: 'block',
                    },
                  }}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
              <code className="bg-secondary text-accent-violet px-1.5 py-1 rounded-md" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MessageContent;
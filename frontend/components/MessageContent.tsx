import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import FileIcon from './icons/FileIcon';
import { Attachment, Message as MessageType } from '../types';
import AudioPlayer from './AudioPlayer'; // Import the new component

interface MessageContentProps {
  message: MessageType;
}

const AudioAttachment: React.FC<{ attachment: Attachment }> = ({ attachment }) => {
  return <AudioPlayer audioUrl={attachment.url} />;
};

const renderAttachment = (attachment: Attachment) => {
  if (attachment.type === 'image') {
    return (
      <div key={attachment.name} className="p-2">
        <img
          src={attachment.url}
          alt={attachment.name}
          className="max-w-xs max-h-64 rounded-lg object-contain"
        />
      </div>
    );
  } else if (attachment.type === 'audio') {
    return <AudioAttachment key={attachment.name} attachment={attachment} />;
  }
  return (
    <a
      href={attachment.url}
      download={attachment.name}
      key={attachment.name}
      className="bg-primary/50 p-3 rounded-lg flex items-center gap-3"
    >
      <FileIcon className="w-6 h-6 text-muted flex-shrink-0" />
      <span className="font-mono text-sm truncate">{attachment.name}</span>
    </a>
  );
};

const MessageContent: React.FC<MessageContentProps> = ({ message }) => {
  const { content, attachments, timestamp } = message;

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(navigator.language, { hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="space-y-1">
      {attachments && attachments.length > 0 && (
        <div className="flex flex-wrap items-start gap-2">
          {attachments.map(renderAttachment)}
        </div>
      )}
      {content && (
        <div className={`prose prose-invert prose-sm text-light`}>
          <ReactMarkdown
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <div className="overflow-x-auto max-w-full w-full min-w-0">
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
                  </div>
                ) : (
                  <code className="bg-secondary text-accent px-1.5 py-1 rounded-md" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
      <div className="flex justify-end items-center">
        <span className="text-xs text-muted-foreground/60">
          {formatTime(timestamp)}
        </span>
      </div>
    </div>
  );
};

export default MessageContent;
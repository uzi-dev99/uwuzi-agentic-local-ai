import React, { useRef, useEffect } from 'react';
import { Message, UserRole } from '../types';
import MessageContent from './MessageContent';

interface MessageListProps {
  messages: Message[];
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }
  return date.toLocaleDateString(navigator.language, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const isLastMessageEmptyAssistantMessage = messages.length > 0 && messages[messages.length - 1].role === UserRole.ASSISTANT && !messages[messages.length - 1].content;

  const messagesWithDates: (Message | { type: 'date'; date: string })[] = [];
  let lastDate: string | null = null;

  messages.forEach(message => {
    const messageDate = new Date(message.timestamp).toDateString();
    if (messageDate !== lastDate) {
      messagesWithDates.push({ type: 'date', date: message.timestamp });
      lastDate = messageDate;
    }
    messagesWithDates.push(message);
  });

  return (
    <div className="p-4 md:p-6 space-y-4 min-w-0 w-full">
      {messagesWithDates.map((item, index) => {
        if ('type' in item && item.type === 'date') {
          return (
            <div key={`date-${index}`} className="text-center text-sm text-muted-foreground/80 py-2">
              <span className="bg-secondary px-3 py-1 rounded-full">{formatDate(item.date)}</span>
            </div>
          );
        }

        const message = item as Message;
        if (message.role === UserRole.ASSISTANT && !message.content) {
            return null;
        }

        return (
            <div
            key={message.id}
            className={`flex items-start gap-3 ${
                message.role === UserRole.USER ? 'justify-end' : 'justify-start'
            }`}
            >
            {message.role === UserRole.ASSISTANT && (
                <div className="w-8 h-8 rounded-full bg-accent flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">
                AI
                </div>
            )}
            <div
                className={`max-w-[calc(100vw-8rem)] md:max-w-2xl rounded-xl px-4 py-2.5 shadow-md break-words overflow-hidden min-w-0 ${
                message.role === UserRole.USER
                    ? 'bg-user-bubble text-light'
                    : 'bg-secondary text-light'
                }`}
            >
                <MessageContent message={message} />
            </div>
            </div>
        );
      })}

      {isLastMessageEmptyAssistantMessage && (
         <div className="flex items-start gap-3 justify-start">
            <div className="w-8 h-8 rounded-full bg-accent-violet flex-shrink-0 flex items-center justify-center text-white font-bold text-sm">AI</div>
            <div className="max-w-[calc(100vw-8rem)] md:max-w-2xl rounded-lg p-3 bg-secondary text-light min-w-0">
                <div className="flex items-center justify-center space-x-1">
                    <div className="w-2 h-2 bg-muted rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-muted rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-muted rounded-full animate-pulse"></div>
                </div>
            </div>
        </div>
      )}
      <div ref={endOfMessagesRef} />
    </div>
  );
};

export default MessageList;
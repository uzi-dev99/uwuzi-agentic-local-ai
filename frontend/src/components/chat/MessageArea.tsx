
import * as React from 'react';
import MessageBubble from '@/components/MessageBubble';
import TypingIndicator from '@/components/TypingIndicator';
import type { Message } from '@/types/chat';
import LongProcessIndicator from './LongProcessIndicator';

interface MessageAreaProps {
    messages: Message[];
    isTyping: boolean;
    isWaitingLongResponse: boolean;
    onCancelProcess: () => void;
}

const MessageArea: React.FC<MessageAreaProps> = ({ messages, isTyping, isWaitingLongResponse, onCancelProcess }) => {
    const messagesEndRef = React.useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    React.useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping, isWaitingLongResponse]);
    
    return (
        <main className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="w-full max-w-full md:max-w-screen-md mx-auto px-4">
                {messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} />
                ))}
                {isWaitingLongResponse && <LongProcessIndicator onCancel={onCancelProcess} />}
                {isTyping && !isWaitingLongResponse && <TypingIndicator />}
                <div ref={messagesEndRef} />
            </div>
        </main>
    );
};

export default MessageArea;

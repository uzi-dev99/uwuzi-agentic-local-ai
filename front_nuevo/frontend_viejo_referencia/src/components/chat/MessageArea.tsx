
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
        <div className="mx-auto w-full min-w-0 px-4 py-4 flex flex-col h-full">
                {messages.length === 0 && !isTyping && !isWaitingLongResponse ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-muted-foreground">
                            <div className="text-lg mb-2">💬</div>
                            <p className="text-sm">Inicia una conversación escribiendo un mensaje</p>
                        </div>
                    </div>
                ) : (
                    <div className="mt-auto flex flex-col gap-4">
                        {messages.map(msg => (
                            <MessageBubble key={msg.id} message={msg} />
                        ))}
                        {isWaitingLongResponse && <LongProcessIndicator onCancel={onCancelProcess} />}
                        {isTyping && !isWaitingLongResponse && <TypingIndicator />}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
    );
};

export default MessageArea;

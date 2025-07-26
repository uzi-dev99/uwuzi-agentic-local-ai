import { useRef, useEffect } from 'react';
import { Message } from "@/hooks/useChat";
import MessageBubble from "./MessageBubble";
import TypingIndicator from './TypingIndicator';

type MessageAreaProps = {
  messages: Message[];
  isTyping: boolean;
};

export default function MessageArea({ messages, isTyping }: MessageAreaProps) {
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);
  return (
    <main className="h-full w-full overflow-y-auto overflow-x-hidden px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 custom-scrollbar">
      <div className="flex flex-col w-full">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>
    </main>
  );
}
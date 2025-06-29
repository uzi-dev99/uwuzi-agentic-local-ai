import * as React from 'react';
import ChatInput from '@/components/ChatInput';
import { useChat } from '@/hooks/useChat';
import ChatHeader from '@/components/chat/ChatHeader';
import MessageArea from '@/components/chat/MessageArea';

const ChatView = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const chatId = searchParams.get('id');
  const folderId = searchParams.get('folderId');

  const {
    messages,
    isSending,
    isTyping,
    chatTitle,
    chatMode,
    isWaitingLongResponse,
    handleSendMessage,
    setChatMode,
    handleSaveTitle,
    handleCancelProcess,
  } = useChat(chatId, folderId);

  return (
    <div className="flex flex-col h-screen chat-view-background">
      <ChatHeader
        chatId={chatId}
        chatTitle={chatTitle}
        onSaveTitle={handleSaveTitle}
      />
      
      <MessageArea
        messages={messages}
        isTyping={isTyping}
        isWaitingLongResponse={isWaitingLongResponse}
        onCancelProcess={handleCancelProcess}
      />

      <footer className="flex-shrink-0 sticky bottom-0 p-3 md:p-4 bg-secondary/50 backdrop-blur-sm border-t border-border/50 z-10">
        <div className="w-full">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            isSending={isSending}
            chatMode={chatMode}
            onChatModeChange={setChatMode}
          />
        </div>
      </footer>
    </div>
  );
};

export default ChatView;

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
    <div className="flex flex-col h-full overflow-hidden chat-view-background">
      <ChatHeader
        chatId={chatId}
        chatTitle={chatTitle}
        onSaveTitle={handleSaveTitle}
      />
      
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
        <MessageArea
          messages={messages}
          isTyping={isTyping}
          isWaitingLongResponse={isWaitingLongResponse}
          onCancelProcess={handleCancelProcess}
        />
      </div>

      <footer className="flex-shrink-0 p-2 sm:p-3 md:p-4 bg-secondary/50 backdrop-blur-sm border-t border-border/50 z-10">
        <div className="max-w-4xl mx-auto w-full min-w-0 px-1 sm:px-0">
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

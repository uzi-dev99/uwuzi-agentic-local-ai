import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../contexts/ChatContext';
import { UserRole, Message as MessageType, ChatMode } from '../types';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { invokeAgent } from '../services/backendService';

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getChatById, addMessage, updateAssistantMessage, addTagToChat, removeTagFromChat, updateChatMode, renameChat } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  
  const chat = id ? getChatById(id) : undefined;

  useEffect(() => {
    if (!chat) {
      const timer = setTimeout(() => {
        if(!getChatById(id!)){
          console.log(`Chat with id ${id} not found. Redirecting.`);
          navigate('/');
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [id, chat, navigate, getChatById]);


  const handleSendMessage = async (message: Omit<MessageType, 'id' | 'role' | 'timestamp'>) => {
    if (!id || !chat) return;
    setIsLoading(true);

    const userMessageForHistory: MessageType = { 
        id: 'temp-user-id', 
        role: UserRole.USER, 
        content: message.content, 
        apiContent: message.apiContent,
        timestamp: new Date().toISOString() 
    };
    
    // Add user message to state
    addMessage(id, { role: UserRole.USER, ...message });
    
    // Immediately add placeholder for assistant's response
    const assistantMessageId = addMessage(id, { role: UserRole.ASSISTANT, content: '' });

    const currentHistory: MessageType[] = [...chat.messages, userMessageForHistory];

    try {
      await invokeAgent(
        currentHistory,
        (chunk: string) => {
          updateAssistantMessage(id, assistantMessageId, chunk);
        },
        (error: Error) => {
          console.error("Failed to get streaming response", error);
          updateAssistantMessage(id, assistantMessageId, "Sorry, I encountered an error.");
        }
      );
    } catch (error) {
        console.error("Failed to invoke agent", error);
        updateAssistantMessage(id, assistantMessageId, "Sorry, I encountered an error.");
    } finally {
        setIsLoading(false);
    }
  };

  if (!chat) {
    return (
        <div className="flex items-center justify-center h-full text-muted">
            Loading chat...
        </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col bg-primary">
      <ChatHeader 
        chat={chat} 
        onUpdateMode={(mode: ChatMode) => updateChatMode(chat.id, mode)}
        onAddTag={(tag: string) => addTagToChat(chat.id, tag)}
        onRemoveTag={(tag: string) => removeTagFromChat(chat.id, tag)}
        onRenameChat={(newTitle: string) => renameChat(chat.id, newTitle)}
      />
      <MessageList messages={chat.messages} />
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatPage;
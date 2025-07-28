import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Keyboard } from '@capacitor/keyboard';
import { useChatStore } from '../contexts/ChatContext';
import { UserRole, Message as MessageType, ChatMode } from '../types';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { invokeDirectChat } from '../services/backendService';

const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getChatById, addMessage, updateAssistantMessage, addTagToChat, removeTagFromChat, updateChatMode, renameChat } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
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

  // Handle keyboard show/hide for mobile
  useEffect(() => {
    const handleKeyboardShow = () => {
      // Scroll to bottom when keyboard appears
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
      }, 300);
    };

    const handleKeyboardHide = () => {
      // Optional: Additional logic when keyboard hides
    };

    let keyboardShowListener: any;
    let keyboardHideListener: any;

    // Setup keyboard listeners
    const setupKeyboardListeners = async () => {
      try {
        // Add keyboard listeners for Capacitor
        keyboardShowListener = await Keyboard.addListener('keyboardWillShow', handleKeyboardShow);
        keyboardHideListener = await Keyboard.addListener('keyboardWillHide', handleKeyboardHide);
      } catch (error) {
        console.log('Keyboard listeners not available (web environment)');
      }
    };

    setupKeyboardListeners();

    return () => {
      if (keyboardShowListener) {
        keyboardShowListener.remove();
      }
      if (keyboardHideListener) {
        keyboardHideListener.remove();
      }
    };
  }, []);


  const handleStopGenerating = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const handleSendMessage = async (message: Omit<MessageType, 'id' | 'role' | 'timestamp'>, attachments: File[]) => {
    if (!id || !chat) return;

    

    // Add user message to state
    addMessage(id, { role: UserRole.USER, ...message });
    
    // Immediately add placeholder for assistant's response
    const assistantMessageId = addMessage(id, { role: UserRole.ASSISTANT, content: '' });

    if (chat.mode === 'agent') {
      updateAssistantMessage(id, assistantMessageId, "Sorry, Agent Mode is not available in this version. Please switch to Chat Mode.");
      setIsLoading(false);
      return;
    }
    if (!id || !chat) return;
    setIsLoading(true);

    const userMessageForHistory: MessageType = { 
        id: 'temp-user-id', 
        role: UserRole.USER, 
        content: message.content, 
        apiContent: message.apiContent,
        timestamp: new Date().toISOString() 
    };

    const currentHistory: MessageType[] = [...chat.messages, userMessageForHistory];

    const controller = new AbortController();
    setAbortController(controller);

    try {
      await invokeDirectChat(
        currentHistory,
        attachments,
        (chunk: string) => {
          updateAssistantMessage(id, assistantMessageId, chunk);
        },
        (error: Error) => {
          if (error.name === 'AbortError') {
            console.log('Request aborted by user.');
            updateAssistantMessage(id, assistantMessageId, ' (Stopped)');
          } else {
            console.error('Failed to get streaming response', error);
            updateAssistantMessage(id, assistantMessageId, 'Sorry, I encountered an error.');
          }
        },
        controller.signal
      );
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted.');
      } else {
        console.error("Failed to invoke agent", error);
        updateAssistantMessage(id, assistantMessageId, "Sorry, I encountered an error.");
      }
    } finally {
      setIsLoading(false);
      setAbortController(null);
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
    <div ref={chatContainerRef} className="h-full w-full flex flex-col bg-primary overflow-x-hidden overflow-y-auto">
      <ChatHeader 
        chat={chat} 
        onUpdateMode={(mode: ChatMode) => updateChatMode(chat.id, mode)}
        onAddTag={(tag: string) => addTagToChat(chat.id, tag)}
        onRemoveTag={(tag: string) => removeTagFromChat(chat.id, tag)}
        onRenameChat={(newTitle: string) => renameChat(chat.id, newTitle)}
      />
      <MessageList messages={chat.messages} />
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} onStopGenerating={handleStopGenerating} />
    </div>
  );
};

export default ChatPage;
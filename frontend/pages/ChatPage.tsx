import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../contexts/ChatContext';
import { UserRole, Message as MessageType, ChatMode, Attachment, FileData } from '../types';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { invokeDirectChat } from '../services/backendService';

// Helper function to convert Base64 Data URL to File object
function dataURLtoFile(dataurl: string, filename: string): File | null {
  const arr = dataurl.split(',');
  if (arr.length < 2) { return null; }
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || mimeMatch.length < 2) { return null; }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getChatById, addMessage, updateAssistantMessage, addTagToChat, removeTagFromChat, updateChatMode, renameChat } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  
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




  const handleStopGenerating = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
  };

  const handleSendMessage = async (message: Omit<MessageType, 'id' | 'role' | 'timestamp'>, attachments: FileData[]) => {
    if (!id || !chat) return;

    const messageAttachmentsForState: Attachment[] = attachments.map(fileData => {
      const attachmentType: Attachment['type'] = fileData.type === 'text' ? 'other' : fileData.type;
      return {
        name: fileData.name,
        type: attachmentType,
        url: fileData.content, // Base64 data URL for preview
      };
    });

    // Add user message to state
    addMessage(id, { role: UserRole.USER, ...message, attachments: messageAttachmentsForState });
    
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

    // Convert FileData to File objects for the backend
    const filesForBackend: File[] = attachments
      .map(fileData => dataURLtoFile(fileData.content, fileData.name))
      .filter((file): file is File => file !== null);

    try {
      await invokeDirectChat(
        currentHistory,
        filesForBackend, // Pass File[] to the backend
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
    <div className="flex flex-col h-full w-full">
      <ChatHeader 
        chat={chat} 
        onUpdateMode={(mode: ChatMode) => updateChatMode(chat.id, mode)}
        onAddTag={(tag: string) => addTagToChat(chat.id, tag)}
        onRemoveTag={(tag: string) => removeTagFromChat(chat.id, tag)}
        onRenameChat={(newTitle: string) => renameChat(chat.id, newTitle)}
      />
      <div className="flex-1 min-h-0 overflow-y-auto">
        <MessageList messages={chat.messages} />
      </div>
      <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} onStopGenerating={handleStopGenerating} />
    </div>
  );
};

export default ChatPage;
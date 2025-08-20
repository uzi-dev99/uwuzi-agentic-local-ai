import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChatStore } from '../contexts/ChatContext';
import { UserRole, Message as MessageType, ChatMode, Attachment, FileData } from '../types';
import ChatHeader from '../components/ChatHeader';
import MessageList from '../components/MessageList';
import MessageInput from '../components/MessageInput';
import { invokeDirectChat, invokeAgent } from '../services/backendService';
import AnimatedPage from '../components/AnimatedPage';

const chatPageVariants = {
  initial: {
    opacity: 0,
    x: '100vw',
  },
  in: {
    opacity: 1,
    x: 0,
  },
  out: {
    opacity: 0,
    x: '100vw',
  },
};

// Helper function to convert Base64 Data URL to File object
// Helper to detect MIME type from file extension
function getMimeTypeFromExtension(filename: string): string {
  const ext = filename.toLowerCase().split('.').pop();
  const mimeMap: { [key: string]: string } = {
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'tiff': 'image/tiff',
    // Audio
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'webm': 'audio/webm',
    'm4a': 'audio/mp4',
    'aac': 'audio/aac',
    'flac': 'audio/flac',
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'csv': 'text/csv',
    'json': 'application/json',
    'rtf': 'application/rtf'
  };
  return mimeMap[ext || ''] || 'application/octet-stream';
}

function dataURLtoFile(dataurl: string, filename: string): File | null {
  console.log('🔄 dataURLtoFile called:', { filename, contentStart: dataurl.substring(0, 50) });
  
  // Handle non-data URL content (like PDF filenames or external files)
  if (!dataurl.startsWith('data:')) {
    console.log('⚠️ Not a data URL, detecting MIME from extension:', filename);
    const detectedMime = getMimeTypeFromExtension(filename);
    console.log('🔍 Detected MIME type from extension:', detectedMime);
    
    // Create a minimal file with detected MIME type
    const blob = new Blob([filename], { type: detectedMime });
    const file = new File([blob], filename, { type: detectedMime });
    console.log('✅ File created from extension:', { name: file.name, size: file.size, type: file.type });
    return file;
  }
  
  const arr = dataurl.split(',');
  if (arr.length < 2) { 
    console.log('❌ Invalid data URL format - no comma separator');
    return null; 
  }
  
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch || mimeMatch.length < 2) { 
    console.log('❌ Invalid data URL format - no MIME type found');
    return null; 
  }
  
  const mime = mimeMatch[1];
  console.log('✅ Detected MIME type from data URL:', mime);
  
  try {
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new File([u8arr], filename, { type: mime });
    console.log('✅ File created successfully from data URL:', { name: file.name, size: file.size, type: file.type });
    return file;
  } catch (error) {
    console.log('❌ Error decoding base64:', error);
    return null;
  }
}

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getChatById, addMessage, setAssistantMessage, addTagToChat, removeTagFromChat, updateChatMode, renameChat } = useChatStore();
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
      // Map FileData types to Attachment types
      let attachmentType: Attachment['type'];
      switch (fileData.type) {
        case 'image':
          attachmentType = 'image';
          break;
        case 'audio':
          attachmentType = 'audio';
          break;
        case 'pdf-small':
          attachmentType = 'pdf-small';
          break;
        case 'pdf-large':
          attachmentType = 'pdf-large';
          break;
        case 'text':
        default:
          attachmentType = 'other';
          break;
      }
      
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
    console.log('🔄 Converting attachments to files:', attachments.length);
    attachments.forEach((fileData, index) => {
      console.log(`📎 Attachment ${index + 1}:`, {
        name: fileData.name,
        type: fileData.type,
        contentLength: fileData.content.length,
        contentStart: fileData.content.substring(0, 50) + '...',
        isDataURL: fileData.content.startsWith('data:')
      });
    });
    
    const filesForBackend: File[] = attachments
      .map((fileData, index) => {
        const file = dataURLtoFile(fileData.content, fileData.name);
        console.log(`🔄 Conversion ${index + 1}:`, {
          original: fileData.name,
          converted: file ? `${file.name} (${file.size} bytes, ${file.type})` : 'FAILED'
        });
        return file;
      })
      .filter((file): file is File => file !== null);
    
    console.log('✅ Files for backend:', filesForBackend.length, filesForBackend.map(f => `${f.name} (${f.size}b)`));

    try {
      if (chat.mode === 'agent') {
        // Use agent mode
        await invokeAgent({
          messages: currentHistory,
          files: filesForBackend,
          onComplete: (response: { content: string }) => {
            setAssistantMessage(id, assistantMessageId, response.content);
          },
          onError: (error: Error) => {
            if (error.name === 'AbortError') {
              console.log('Agent request aborted by user.');
              setAssistantMessage(id, assistantMessageId, ' (Stopped)');
            } else {
              console.error('Failed to get agent response', error);
              setAssistantMessage(id, assistantMessageId, 'Sorry, I encountered an error with the agent.');
            }
          },
          signal: controller.signal,
        });
      } else {
        // Use direct chat mode
        await invokeDirectChat({
          messages: currentHistory,
          files: filesForBackend,
          onComplete: (response: { content: string }) => {
            setAssistantMessage(id, assistantMessageId, response.content);
          },
          onError: (error: Error) => {
            if (error.name === 'AbortError') {
              console.log('Request aborted by user.');
              setAssistantMessage(id, assistantMessageId, ' (Stopped)');
            } else {
              console.error('Failed to get response', error);
              setAssistantMessage(id, assistantMessageId, 'Sorry, I encountered an error.');
            }
          },
          signal: controller.signal,
        });
      }
    } catch (error) {
        console.error("Failed to invoke agent", error);
        if (error instanceof Error) {
          setAssistantMessage(id, assistantMessageId, `Sorry, an error occurred: ${error.message}`);
        } else {
          setAssistantMessage(id, assistantMessageId, "Sorry, an unknown error occurred.");
        }
    } finally {
      setIsLoading(false);
      setAbortController(null);
    }
  };

  if (!chat) {
    return (
        <AnimatedPage className="flex items-center justify-center h-full text-muted">
            Loading chat...
        </AnimatedPage>
    );
  }

  return (
    <AnimatedPage className="flex flex-col h-full w-full" variants={chatPageVariants}>
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
    </AnimatedPage>
  );
};

export default ChatPage;
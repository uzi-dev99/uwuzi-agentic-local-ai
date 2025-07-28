import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { Chat, Folder, Message, UserRole, ChatMode } from '../types';

interface ChatContextType {
  folders: Folder[];
  chats: Chat[];
  createFolder: (name: string) => void;
  renameFolder: (id: string, newName: string) => void;
  deleteFolder: (id: string) => void;
  createChat: (folderId?: string | null) => Chat;
  getChatById: (id: string) => Chat | undefined;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateAssistantMessage: (chatId: string, messageId: string, chunk: string) => void;
  deleteChat: (id: string) => void;
  renameChat: (chatId: string, newTitle: string) => void;
  clearAllData: () => void;
  addTagToChat: (chatId: string, tag: string) => void;
  removeTagFromChat: (chatId: string, tag: string) => void;
  updateChatMode: (chatId: string, mode: ChatMode) => void;
  getUniqueTags: () => string[];
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const initialFoldersData: Folder[] = [{ id: '1', name: 'My First Folder' }];

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [folders, setFolders] = useLocalStorage<Folder[]>('chat_folders', []);
  const [chats, setChats] = useLocalStorage<Chat[]>('chat_conversations', []);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const rawFolders = window.localStorage.getItem('chat_folders');
    if (!rawFolders) {
        setFolders(initialFoldersData);
    }

    const rawChats = window.localStorage.getItem('chat_conversations');
    if (!rawChats) {
        const welcomeChat: Chat = {
            id: 'welcome-chat',
            title: 'Welcome!',
            messages: [
                { id: crypto.randomUUID(), role: UserRole.ASSISTANT, content: 'Hello! How can I help you today? Feel free to ask me anything.', timestamp: new Date().toISOString() }
            ],
            folderId: null,
            createdAt: new Date().toISOString(),
            tags: ['example'],
            mode: 'chat',
        };
        setChats([welcomeChat]);
    } else {
        const loadedChats = JSON.parse(rawChats);
        const migratedChats = loadedChats.map((chat: any) => ({
            ...chat,
            tags: chat.tags || [],
            mode: chat.mode || 'chat',
            messages: chat.messages.map((msg: any) => ({
              ...msg,
              apiContent: msg.apiContent || msg.content,
            }))
        }));
        setChats(migratedChats);
    }
    
    setIsInitialized(true);
  }, []);

  const createFolder = (name: string) => {
    const newFolder: Folder = { id: crypto.randomUUID(), name };
    setFolders(prev => [...prev, newFolder]);
  };

  const renameFolder = (id: string, newName: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, name: newName } : f));
  };
  
  const deleteFolder = (id: string) => {
    setFolders(prev => prev.filter(f => f.id !== id));
    setChats(prev => prev.map(c => c.folderId === id ? { ...c, folderId: null } : c));
  };

  const createChat = (folderId: string | null = null): Chat => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      folderId,
      createdAt: new Date().toISOString(),
      tags: [],
      mode: 'chat',
    };
    setChats(prev => [newChat, ...prev]);
    return newChat;
  };

  const getChatById = (id: string) => chats.find(chat => chat.id === id);

  const addMessage = (chatId: string, message: Omit<Message, 'id' | 'timestamp'>): string => {
    const newMessageId = crypto.randomUUID();
    setChats(prev => prev.map(chat => {
      if (chat.id === chatId) {
        const newMessage: Message = {
          ...message,
          id: newMessageId,
          timestamp: new Date().toISOString(),
        };
        const updatedMessages = [...chat.messages, newMessage];

        const isNewChat = chat.messages.length === 0 || (chat.messages.length === 1 && chat.messages[0].role === UserRole.ASSISTANT);
        let newTitle = chat.title;
        
        if (isNewChat && message.role === UserRole.USER) {
            const fileAttachmentRegex = /^\(File Attached: (.*?)\)\n*/;
            let contentForTitle = message.content.replace(fileAttachmentRegex, '').trim();
            
            if (!contentForTitle) {
                const match = message.content.match(fileAttachmentRegex);
                contentForTitle = match ? `Chat about ${match[1]}` : 'New Chat';
            }

            if (contentForTitle && contentForTitle.length > 1) {
              newTitle = contentForTitle.substring(0, 30) + (contentForTitle.length > 30 ? '...' : '');
            }
        }

        return { ...chat, messages: updatedMessages, title: newTitle };
      }
      return chat;
    }));
    return newMessageId;
  };

  const updateAssistantMessage = (chatId: string, messageId: string, chunk: string) => {
    setChats(prev => prev.map(chat => {
        if (chat.id === chatId) {
            const updatedMessages = chat.messages.map(msg => {
                if (msg.id === messageId) {
                    const newContent = msg.content + chunk;
                    return { ...msg, content: newContent, apiContent: newContent };
                }
                return msg;
            });
            return { ...chat, messages: updatedMessages };
        }
        return chat;
    }));
  };

  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
  };

  const renameChat = (chatId: string, newTitle: string) => {
    if(!newTitle.trim()) return;
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle.trim() } : c));
  };

  const clearAllData = () => {
    setFolders(initialFoldersData);
    setChats([]);
  };

  const addTagToChat = (chatId: string, tag: string) => {
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) return;
    setChats(prev => prev.map(c => 
      c.id === chatId 
      ? { ...c, tags: [...new Set([...c.tags, cleanTag])] } 
      : c
    ));
  };

  const removeTagFromChat = (chatId: string, tag: string) => {
    setChats(prev => prev.map(c => 
      c.id === chatId 
      ? { ...c, tags: c.tags.filter(t => t !== tag) } 
      : c
    ));
  };

  const updateChatMode = (chatId: string, mode: ChatMode) => {
    setChats(prev => prev.map(c => c.id === chatId ? { ...c, mode } : c));
  };

  const getUniqueTags = (): string[] => {
    return [...new Set(chats.flatMap(chat => chat.tags))].sort();
  };

  const value = {
    folders,
    chats,
    createFolder,
    renameFolder,
    deleteFolder,
    createChat,
    getChatById,
    addMessage,
    updateAssistantMessage,
    deleteChat,
    renameChat,
    clearAllData,
    addTagToChat,
    removeTagFromChat,
    updateChatMode,
    getUniqueTags,
  };

  return <ChatContext.Provider value={value}>{isInitialized ? children : null}</ChatContext.Provider>;
};

export const useChatStore = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatStore must be used within a ChatProvider');
  }
  return context;
};
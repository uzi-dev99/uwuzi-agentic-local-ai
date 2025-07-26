"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSwipeGesture } from '@/hooks/useSwipeGesture';
import { useSidebar } from '@/context/SidebarContext';
import { useHasMounted } from '@/hooks/useHasMounted';
import TagList from './TagList';
import NewChatButton from './NewChatButton';
import ChatListItem from './ChatListItem';
import useChatStore from '@/hooks/useChatStore';
import useFolderStore from '@/hooks/useFolderStore';
import SearchBar from './SearchBar';

export default function HomeContent() {
  const router = useRouter();
  const { toggleSidebar } = useSidebar();
  const { tags, activeTag, setActiveTag, getFilteredChats, addNewChat } = useChatStore();
  const { folders, selectedFolderId } = useFolderStore();
  const hasMounted = useHasMounted();

  useSwipeGesture({ onSwipeRight: toggleSidebar });

  if (!hasMounted) {
    return null; // O un spinner de carga
  }

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleAddNewChat = async () => {
    const newChatId = addNewChat(selectedFolderId || undefined);
    // Asegurar que el estado se actualice antes de navegar
    await new Promise(resolve => setTimeout(resolve, 50));
    router.push(`/chat/${newChatId}`);
  };

  
  const currentFolder = selectedFolderId ? folders.find(f => f.id === selectedFolderId) : null;
  const pinnedChatIds = currentFolder ? currentFolder.pinnedChatIds : [];
  const filteredChats = getFilteredChats(selectedFolderId, pinnedChatIds);
  const pageTitle = currentFolder ? currentFolder.name : 'Todos los chats';

  return (
    <div className="flex-1 px-3 py-2 sm:px-4 sm:py-3 md:px-5 md:py-4 overflow-y-auto">
      <h1 className="text-2xl font-bold text-foreground mb-4">{pageTitle}</h1>
      <SearchBar />
      <TagList tags={tags} activeTag={activeTag} setActiveTag={setActiveTag} />
      <NewChatButton onClick={handleAddNewChat} />
      <div className="space-y-2">
        {filteredChats.map((chat) => (
          <ChatListItem 
            key={chat.id} 
            {...chat} 
            onClick={handleChatClick}
            avatar="/default-avatar.png" // Added default avatar prop
            folderId={selectedFolderId}
          />
        ))}
      </div>
    </div>
  );
}
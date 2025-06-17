import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import type { Chat } from '@/types/chat';
import { SidebarProvider } from '@/components/ui/sidebar';
import HomeSidebar from '@/components/HomeSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import HomeHeader from '@/components/home/HomeHeader';
import ChatFilters from '@/components/home/ChatFilters';
import ChatList from '@/components/home/ChatList';
import NewChatButton from '@/components/home/NewChatButton';

interface HomeViewProps {
  selectedFolderId: string | null;
  setSelectedFolderId: (id: string | null) => void;
}

const HomeView: React.FC<HomeViewProps> = ({ selectedFolderId, setSelectedFolderId }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  
  const userId = currentUser!.id;

  const { data: chats = [], isLoading: isLoadingChats } = useQuery({
    queryKey: ['chats', userId],
    queryFn: () => api.fetchChats(userId),
    enabled: !!userId,
  });

  const { data: folders = [], isLoading: isLoadingFolders } = useQuery({
      queryKey: ['folders', userId],
      queryFn: () => api.fetchFolders(userId),
      enabled: !!userId,
  });

  const updateTagsMutation = useMutation({
    mutationFn: (variables: { chatId: string, newTags: string[] }) => 
        api.updateChat({ chatId: variables.chatId, tags: variables.newTags, userId }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chats', userId] });
    }
  });

  const deleteChatMutation = useMutation({
    mutationFn: (chatId: string) => api.deleteChat({ chatId, userId }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chats', userId] });
    }
  });

  const createFolderMutation = useMutation({
    mutationFn: (folderName: string) => api.createFolder({ name: folderName, userId }),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['folders', userId] });
    }
  });

  const deleteFolderMutation = useMutation({
    mutationFn: (folderId: string) => api.deleteFolder({ folderId, userId }),
    onSuccess: (_data, folderId) => {
        queryClient.invalidateQueries({ queryKey: ['folders', userId] });
        queryClient.invalidateQueries({ queryKey: ['chats', userId] });
        if (selectedFolderId === folderId) {
          setSelectedFolderId(null);
        }
    }
  });

  const handleUpdateTags = (chatId: string, newTags: string[]) => {
    updateTagsMutation.mutate({ chatId, newTags });
  };

  const handleDeleteFolder = (folderId: string) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar esta carpeta? Los chats que contiene no se borrarán y se moverán a la vista 'Todas'.")) {
      deleteFolderMutation.mutate(folderId);
    }
  };

  const handleNewFolder = () => {
    const folderName = prompt("Introduce el nombre de la nueva carpeta:");
    if (folderName) {
      createFolderMutation.mutate(folderName);
    }
  };

  const handleNewChat = () => {
    const newChatId = new Date().getTime().toString();
    const folderParam = selectedFolderId ? `&folderId=${selectedFolderId}` : '';
    navigate(`/?view=chat&id=${newChatId}${folderParam}`);
  };

  const handleDeleteChat = (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteChatMutation.mutate(chatId);
  };

  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  const folderName = selectedFolder ? selectedFolder.name : "Conversaciones";

  const allTags = React.useMemo(() => {
    const tagsSet = new Set<string>();
    chats.forEach(chat => {
        chat.tags?.forEach(tag => tagsSet.add(tag));
    });
    return Array.from(tagsSet).sort();
  }, [chats]);

  const toggleTagFilter = (tag: string) => {
    setSelectedTags(prev => 
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const filteredChats = chats.filter(chat => {
    const folderMatch = selectedFolderId ? chat.folderId === selectedFolderId : true;

    const searchMatch = searchTerm
        ? chat.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          (chat.tags || []).some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
        : true;
    
    const tagsMatch = selectedTags.length > 0
        ? selectedTags.every(st => (chat.tags || []).includes(st))
        : true;

    return folderMatch && searchMatch && tagsMatch;
  });

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <HomeSidebar
          className="hidden lg:flex"
          folders={folders}
          selectedFolderId={selectedFolderId}
          onSelectFolder={setSelectedFolderId}
          onNewFolder={handleNewFolder}
          onDeleteFolder={handleDeleteFolder}
          isLoading={isLoadingFolders}
        />
        <main className="flex-1">
          <div className="relative min-h-screen p-4 animate-fade-in">
            <div className="max-w-4xl mx-auto">
              <HomeHeader folderName={folderName} />
              <ChatFilters
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                allTags={allTags}
                selectedTags={selectedTags}
                toggleTagFilter={toggleTagFilter}
                clearTagFilters={() => setSelectedTags([])}
              />
              <ChatList
                isLoading={isLoadingChats}
                chats={filteredChats}
                selectedFolderId={selectedFolderId}
                handleDeleteChat={handleDeleteChat}
                handleUpdateTags={handleUpdateTags}
                toggleTagFilter={toggleTagFilter}
              />
            </div>
            
            <NewChatButton onClick={handleNewChat} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default HomeView;

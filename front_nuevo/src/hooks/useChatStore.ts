import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  tags: string[];
  folderId?: string;
}

interface ChatStore {
  chats: Chat[];
  tags: string[];
  activeTag: string;
  searchTerm: string;
  isInfoPanelOpen: boolean;
  setActiveTag: (tag: string) => void;
  getFilteredChats: (selectedFolderId: string | null | undefined, pinnedChatIds: string[]) => Chat[];
  addNewChat: (folderId?: string) => string;
  updateChatName: (id: string, name: string) => void;
  toggleInfoPanel: () => void;
  getChatById: (id: string) => Chat | undefined;
  addTagToChat: (chatId: string, newTag: string) => void;
  removeTagFromChat: (chatId: string, tagToRemove: string) => void;
  archiveChat: (chatId: string) => void;
  deleteChat: (chatId: string) => void;
  clearChatMessages: (chatId: string) => void;
  addNewTag: (newTag: string) => void;
  setSearchTerm: (term: string) => void;
  cleanUnusedTags: () => void;
  moveChatToFolder: (chatId: string, folderId: string | null) => void;
  getChatsByFolder: (folderId: string | null) => Chat[];
}

const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      chats: [
        {
          id: 'chat-1',
          name: 'Juan Perez',
          lastMessage: '¡Hola! ¿Cómo estás?',
          timestamp: '10:45 AM',
          unreadCount: 2,
          tags: ['personal'],
          folderId: 'folder-1'
        },
        {
          id: 'chat-2',
          name: 'Equipo de Soporte',
          lastMessage: 'Hemos recibido tu solicitud y la estamos procesando.',
          timestamp: 'Ayer',
          unreadCount: 0,
          tags: ['trabajo'],
          folderId: 'folder-2'
        },
        {
          id: 'chat-3',
          name: 'Recordatorio Cita',
          lastMessage: 'Tu cita es mañana a las 3 PM.',
          timestamp: '15/7/2025',
          unreadCount: 1,
          tags: ['personal', 'recordatorio'],
          folderId: 'folder-1'
        },
      ],
      tags: ['personal', 'trabajo', 'recordatorio', 'ideas'],
      activeTag: 'Todos',
      searchTerm: '',
      isInfoPanelOpen: false,
      setActiveTag: (tag) => set({ activeTag: tag }),
      getFilteredChats: (selectedFolderId, pinnedChatIds) => {
        const { chats, activeTag, searchTerm } = get();
        let filtered = chats;
        
        // Filtrar por carpeta seleccionada
        if (selectedFolderId !== undefined) {
          if (selectedFolderId === null) {
            // Mostrar todos los chats
            filtered = chats;
          } else {
            // Mostrar solo chats de la carpeta seleccionada
            filtered = filtered.filter(chat => chat.folderId === selectedFolderId);
          }
        }
        
        // Filtrar por tag activo
        if (activeTag !== 'Todos') {
          filtered = filtered.filter(chat => chat.tags.includes(activeTag));
        }
        
        // Filtrar por término de búsqueda
        if (searchTerm) {
          const lowerTerm = searchTerm.toLowerCase();
          filtered = filtered.filter(chat => 
            chat.name.toLowerCase().includes(lowerTerm) || 
            chat.tags.some(tag => tag.toLowerCase().includes(lowerTerm))
          );
        }
        
        // Ordenar: anclados primero, luego por timestamp (más reciente primero)
        filtered.sort((a, b) => {
          const aIsPinned = pinnedChatIds.includes(a.id);
          const bIsPinned = pinnedChatIds.includes(b.id);

          if (aIsPinned && !bIsPinned) return -1;
          if (!aIsPinned && bIsPinned) return 1;

          // Aquí puedes añadir una lógica de ordenación por fecha si la tienes
          // Por ahora, se mantiene el orden que viene por defecto
          return 0; 
        });

        return filtered;
      },
      addNewChat: (folderId) => {
        const newChatId = uuidv4();
        const newChat: Chat = {
          id: newChatId,
          name: 'Nueva Conversación',
          lastMessage: '',
          timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
          unreadCount: 0,
          tags: [],
          folderId: folderId || undefined,
        };
        set(state => ({ chats: [newChat, ...state.chats] }));
        return newChatId;
      },
      updateChatName: (id, name) => {
        set(state => ({
          chats: state.chats.map(chat => 
            chat.id === id ? { ...chat, name } : chat
          )
        }));
      },
      toggleInfoPanel: () => set(state => ({ isInfoPanelOpen: !state.isInfoPanelOpen })),
      getChatById: (id) => get().chats.find(chat => chat.id === id),
      addTagToChat: (chatId, newTag) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, tags: [...chat.tags, newTag] }
              : chat
          ),
          tags: state.tags.includes(newTag) ? state.tags : [...state.tags, newTag]
        }));
      },
      removeTagFromChat: (chatId, tagToRemove) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, tags: chat.tags.filter(t => t !== tagToRemove) }
              : chat
          )
        }));
        // Limpiar tags no utilizados después de remover
        get().cleanUnusedTags();
      },
      archiveChat: (chatId) => {
        // Lógica para archivar. Por ahora, solo un console.log
        console.log(`Archivando chat ${chatId}`);
      },
      deleteChat: (chatId) => {
        set(state => ({ 
          chats: state.chats.filter(chat => chat.id !== chatId),
          isInfoPanelOpen: false // Cerrar el panel de info al eliminar un chat
        }));
        // Limpiar tags no utilizados después de eliminar chat
        get().cleanUnusedTags();
      },
      clearChatMessages: (chatId) => {
        // Limpiar mensajes del localStorage para este chat específico
        localStorage.removeItem(`chatMessages-${chatId}`);
        // Actualizar el lastMessage del chat
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, lastMessage: '', timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }
              : chat
          )
        }));
      },
      addNewTag: (newTag) => {
        set(state => {
          if (!state.tags.includes(newTag)) {
            return { tags: [...state.tags, newTag] };
          }
          return state;
        });
      },
      setSearchTerm: (term) => set({ searchTerm: term }),
      cleanUnusedTags: () => {
        const { chats, tags, activeTag } = get();
        // Obtener todos los tags que están siendo utilizados por los chats
        const usedTags = new Set<string>();
        chats.forEach(chat => {
          chat.tags.forEach(tag => usedTags.add(tag));
        });
        
        // Filtrar solo los tags que están siendo utilizados
        const filteredTags = tags.filter(tag => usedTags.has(tag));
        
        // Si el tag activo ya no existe, resetear a 'Todos'
        const newActiveTag = filteredTags.includes(activeTag) ? activeTag : 'Todos';
        
        set({ 
          tags: filteredTags,
          activeTag: newActiveTag
        });
      },
      moveChatToFolder: (chatId, folderId) => {
        set(state => ({
          chats: state.chats.map(chat =>
            chat.id === chatId
              ? { ...chat, folderId: folderId || undefined }
              : chat
          )
        }));
      },
      getChatsByFolder: (folderId) => {
        const { chats } = get();
        if (folderId === null) {
          return chats.filter(chat => !chat.folderId);
        }
        return chats.filter(chat => chat.folderId === folderId);
      },
    }),
    {
      name: 'chat-storage', // Nombre para el almacenamiento local
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useChatStore;
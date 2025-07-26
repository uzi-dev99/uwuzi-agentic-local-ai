import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

interface Folder {
  id: string;
  name: string;
  pinnedChatIds: string[];
}

interface FolderStore {
  folders: Folder[];
  selectedFolderId: string | null;
  setSelectedFolderId: (folderId: string | null) => void;
  addFolder: (name: string) => string;
  deleteFolder: (folderId: string) => void;
  getFolderById: (id: string) => Folder | undefined;
  updateFolderName: (folderId: string, newName: string) => void;
  pinChat: (folderId: string, chatId: string) => void;
  unpinChat: (folderId: string, chatId: string) => void;
}

const useFolderStore = create<FolderStore>()(
  persist(
    (set, get) => ({
      folders: [
        {
          id: 'folder-1',
          name: 'Personal',
          pinnedChatIds: []
        },
        {
          id: 'folder-2', 
          name: 'Trabajo',
          pinnedChatIds: []
        },
        {
          id: 'folder-3',
          name: 'Ideas',
          pinnedChatIds: []
        }
      ],
      selectedFolderId: null,
      setSelectedFolderId: (folderId) => set({ selectedFolderId: folderId }),
      addFolder: (name) => {
        const newFolderId = uuidv4();
        const newFolder: Folder = {
          id: newFolderId,
          name: name,
          pinnedChatIds: []
        };
        set(state => ({ folders: [...state.folders, newFolder] }));
        return newFolderId;
      },
      deleteFolder: (folderId) => {
        set(state => ({
          folders: state.folders.filter(folder => folder.id !== folderId),
          selectedFolderId: state.selectedFolderId === folderId ? null : state.selectedFolderId
        }));
      },
      getFolderById: (id) => {
        const folder = get().folders.find(folder => folder.id === id);
        // Migración: asegurar que pinnedChatIds existe
        if (folder && !folder.pinnedChatIds) {
          folder.pinnedChatIds = [];
        }
        return folder;
      },
      updateFolderName: (folderId, newName) => {
        set(state => ({
          folders: state.folders.map(folder =>
            folder.id === folderId
              ? { ...folder, name: newName }
              : folder
          )
        }));
      },
      pinChat: (folderId, chatId) => {
        set(state => ({
          folders: state.folders.map(folder =>
            folder.id === folderId
              ? { ...folder, pinnedChatIds: [...folder.pinnedChatIds, chatId] }
              : folder
          )
        }));
      },
      unpinChat: (folderId, chatId) => {
        set(state => ({
          folders: state.folders.map(folder =>
            folder.id === folderId
              ? { ...folder, pinnedChatIds: folder.pinnedChatIds.filter(id => id !== chatId) }
              : folder
          )
        }));
      }
    }),
    {
      name: 'folder-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useFolderStore;
export type { Folder };
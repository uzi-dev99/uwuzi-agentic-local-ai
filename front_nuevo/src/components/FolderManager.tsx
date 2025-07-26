'use client';

import React, { useState } from 'react';
import { Folder, Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import useFolderStore from '@/hooks/useFolderStore';
import useChatStore from '@/hooks/useChatStore';
import { useHasMounted } from '@/hooks/useHasMounted';

interface FolderManagerProps {
  onFolderSelect: (folderId: string | null) => void;
  selectedFolderId: string | null;
}

const FolderManager: React.FC<FolderManagerProps> = ({ onFolderSelect, selectedFolderId }) => {
  const { folders, addFolder, deleteFolder, updateFolderName } = useFolderStore();
  const { getChatsByFolder } = useChatStore();
  const hasMounted = useHasMounted();
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      addFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreating(false);
    }
  };

  const handleDeleteFolder = (folderId: string) => {
    const chatsInFolder = getChatsByFolder(folderId);
    if (chatsInFolder.length > 0) {
      if (confirm(`Esta carpeta contiene ${chatsInFolder.length} chat(s). ¿Estás seguro de que quieres eliminarla?`)) {
        deleteFolder(folderId);
        if (selectedFolderId === folderId) {
          onFolderSelect(null);
        }
      }
    } else {
      deleteFolder(folderId);
      if (selectedFolderId === folderId) {
        onFolderSelect(null);
      }
    }
  };

  const handleEditFolder = (folderId: string, currentName: string) => {
    setEditingFolderId(folderId);
    setEditingName(currentName);
  };

  const handleSaveEdit = () => {
    if (editingName.trim() && editingFolderId) {
      updateFolderName(editingFolderId, editingName.trim());
      setEditingFolderId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingFolderId(null);
    setEditingName('');
  };

  return (
    <div className="space-y-2">
      {/* Botón para mostrar todos los chats */}
      <button
        onClick={() => onFolderSelect(null)}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
          selectedFolderId === null
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-muted text-card-foreground'
        }`}
      >
        <Folder className="h-4 w-4" />
        <span>Todos los chats</span>
      </button>

      {/* Lista de carpetas */}
      {folders.map((folder) => (
        <div key={folder.id} className="group">
          {editingFolderId === folder.id ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                className="flex-1 bg-input border border-border rounded px-2 py-1 text-sm text-card-foreground"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveEdit();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="p-1 hover:bg-muted rounded text-green-600"
              >
                <Check className="h-3 w-3" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 hover:bg-muted rounded text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center">
              <button
                onClick={() => onFolderSelect(folder.id)}
                className={`flex-1 flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  selectedFolderId === folder.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-card-foreground'
                }`}
              >
                <Folder className="h-4 w-4" />
                <span className="truncate">{folder.name}</span>
                {hasMounted && (
                  <span className="text-xs text-muted-foreground ml-auto">
                    {getChatsByFolder(folder.id).length}
                  </span>
                )}
              </button>
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 ml-1">
                <button
                  onClick={() => handleEditFolder(folder.id, folder.name)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-card-foreground"
                >
                  <Edit2 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDeleteFolder(folder.id)}
                  className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Formulario para crear nueva carpeta */}
      {isCreating ? (
        <div className="flex items-center gap-2 px-3 py-2">
          <Folder className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="Nombre de la carpeta"
            className="flex-1 bg-input border border-border rounded px-2 py-1 text-sm text-card-foreground"
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCreateFolder();
              if (e.key === 'Escape') {
                setIsCreating(false);
                setNewFolderName('');
              }
            }}
            autoFocus
          />
          <button
            onClick={handleCreateFolder}
            className="p-1 hover:bg-muted rounded text-green-600"
          >
            <Check className="h-3 w-3" />
          </button>
          <button
            onClick={() => {
              setIsCreating(false);
              setNewFolderName('');
            }}
            className="p-1 hover:bg-muted rounded text-red-600"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors hover:bg-muted text-muted-foreground hover:text-card-foreground"
        >
          <Plus className="h-4 w-4" />
          <span>Nueva carpeta</span>
        </button>
      )}
    </div>
  );
};

export default FolderManager;
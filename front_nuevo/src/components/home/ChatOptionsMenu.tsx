"use client";

import React from 'react';
import useChatStore from '@/hooks/useChatStore';
import useFolderStore from '@/hooks/useFolderStore';
import { Pin, Trash2, X } from 'lucide-react';

interface ChatOptionsMenuProps {
  chatId: string;
  folderId: string | null;
  chatTags: string[];
  isOpen: boolean;
  onClose: () => void;
  isPinned: boolean;
}

export default function ChatOptionsMenu({ chatId, folderId, isOpen, onClose, isPinned }: ChatOptionsMenuProps) {
  const { deleteChat } = useChatStore();
  const { pinChat, unpinChat } = useFolderStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('¿Estás seguro de que quieres eliminar este chat?')) {
      deleteChat(chatId);
      onClose();
    }
  };

  const handlePinToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (folderId) {
      if (isPinned) {
        unpinChat(folderId, chatId);
      } else {
        pinChat(folderId, chatId);
      }
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 top-10 z-10 w-48 bg-muted rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
      <div className="py-1">
        <button
          onClick={handlePinToggle}
          className="flex items-center w-full px-4 py-2 text-sm text-left text-foreground hover:bg-background"
        >
          <Pin className="mr-3 h-5 w-5" />
          <span>{isPinned ? 'Desanclar' : 'Anclar'}</span>
        </button>
        <button
          onClick={handleDelete}
          className="flex items-center w-full px-4 py-2 text-sm text-left text-red-500 hover:bg-background"
        >
          <Trash2 className="mr-3 h-5 w-5" />
          <span>Eliminar</span>
        </button>
      </div>
    </div>
  );
}
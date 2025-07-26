"use client";

import React, { useState } from 'react';
import { Edit2, Pin } from 'lucide-react';
import ChatOptionsMenu from './ChatOptionsMenu';
import useChatStore from '@/hooks/useChatStore';
import useFolderStore from '@/hooks/useFolderStore';

export interface ChatListItemProps {
  id: string;
  avatar: string; // Podría ser una URL en el futuro
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  tags: string[];
  folderId: string | null;
  onClick: (id: string) => void;
}

export default function ChatListItem({ id, avatar, name, lastMessage, timestamp, unreadCount, tags, folderId, onClick }: ChatListItemProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const { updateChatName } = useChatStore();
  const { getFolderById } = useFolderStore();

  const folder = folderId ? getFolderById(folderId) : null;
  const isPinned = folder && folder.pinnedChatIds && folder.pinnedChatIds.includes(id);

  const handleNameEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(name);
  };

  const handleNameSave = () => {
    if (editName.trim() && editName.trim() !== name) {
      updateChatName(id, editName.trim());
    }
    setIsEditing(false);
  };

  const handleNameCancel = () => {
    setEditName(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave();
    } else if (e.key === 'Escape') {
      handleNameCancel();
    }
  };
  return (
    <div className="relative">
      <div 
        className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-muted transition-colors"
        onClick={() => onClick(id)}
      >
        <div className="w-12 h-12 bg-muted rounded-full flex-shrink-0"></div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={handleKeyDown}
                  className="text-base font-bold bg-transparent border-b border-primary focus:outline-none flex-1 min-w-0"
                  maxLength={50}
                  autoFocus
                />
              ) : (
                <>
                  <p className="text-base font-bold truncate text-foreground flex-1 flex items-center gap-2">
                    {isPinned && <Pin size={14} className="text-primary" />}
                    <span>{name}</span>
                  </p>
                  <button
                    onClick={handleNameEdit}
                    className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                  >
                    <Edit2 size={14} />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <p className="text-xs text-muted-foreground flex-shrink-0">{timestamp}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(!isMenuOpen);
                }}
                className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground transition-colors"
              >
                ⋯
              </button>
            </div>
          </div>
          <div className="flex justify-between items-start">
            <p className="text-sm text-card-foreground truncate">{lastMessage}</p>
            {unreadCount > 0 && (
              <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full px-2 py-0.5 ml-2 flex-shrink-0">
                {unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
      
      <ChatOptionsMenu
        chatId={id}
        folderId={folderId}
        chatTags={tags}
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isPinned={isPinned ?? false}
      />
    </div>
  );
}
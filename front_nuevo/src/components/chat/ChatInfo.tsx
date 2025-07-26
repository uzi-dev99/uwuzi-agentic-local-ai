"use client";

import React from 'react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import useChatStore from '@/hooks/useChatStore';
import PageHeader from '../ui/PageHeader';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export default function ChatInfo({ chatId }: { chatId: string }) {
  const {
    isInfoPanelOpen,
    toggleInfoPanel,
    getChatById,
    addTagToChat,
    removeTagFromChat,
    archiveChat,
    deleteChat,
    clearChatMessages,
    tags: allTags
  } = useChatStore();
  
  const chat = getChatById(chatId);
  const [newTag, setNewTag] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const router = useRouter();

  if (!chat) return null;

  const handleDeleteChat = () => {
    deleteChat(chatId);
    router.push('/home');
  };

  const handleClearChat = () => {
    clearChatMessages(chatId);
    setShowClearConfirm(false);
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-background shadow-lg transform transition-transform duration-300 ease-in-out ${isInfoPanelOpen ? 'translate-x-0' : 'translate-x-full'} z-50`}>
      <PageHeader actionSlot={
        <button onClick={toggleInfoPanel} className="p-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      }>
        <h2 className="text-lg font-bold">Información</h2>
      </PageHeader>
      <div className="p-4 space-y-6">
        <div>
          <h3 className="font-bold text-xl mb-2">{chat.name}</h3>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Tags</h4>
          <div className="flex flex-wrap gap-2 mb-3">
            {chat.tags.map(tag => (
              <div key={tag} className="flex items-center bg-muted rounded-full px-3 py-1 text-sm">
                <span className="text-foreground">{tag}</span>
                <button onClick={() => removeTagFromChat(chatId, tag)} className="ml-2 text-muted-foreground hover:text-foreground">
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              placeholder="Añadir nuevo tag..."
              className="flex-1 bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
            />
            <button onClick={() => { addTagToChat(chatId, newTag); setNewTag(''); }} className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-semibold">Añadir</button>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Acciones</h4>
          <div className="space-y-2">
            <button onClick={() => archiveChat(chatId)} className="w-full text-left p-2 rounded-lg text-foreground hover:bg-muted">Archivar Chat</button>
            <button onClick={() => setShowClearConfirm(true)} className="w-full text-left p-2 rounded-lg text-foreground hover:bg-muted">Vaciar Chat</button>
            <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-left p-2 rounded-lg text-red-500 hover:bg-red-500 hover:text-white">Eliminar Chat</button>
          </div>
        </div>
      </div>
      
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteChat}
        title="Eliminar Chat"
        message={`¿Estás seguro de que quieres eliminar el chat "${chat.name}"? Esta acción no se puede deshacer.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        variant="destructive"
      />
      
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearChat}
        title="Vaciar Chat"
        message={`¿Estás seguro de que quieres vaciar todos los mensajes del chat "${chat.name}"? Esta acción no se puede deshacer.`}
        confirmText="Vaciar"
        cancelText="Cancelar"
        variant="destructive"
      />
    </div>
  );
}
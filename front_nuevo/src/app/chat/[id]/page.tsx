"use client";

import { useEffect, useState, use } from 'react';
import ChatInfo from '@/components/chat/ChatInfo';
import ChatInput from "@/components/chat/ChatInput";
import ChatMessages from "@/components/chat/ChatMessages";
import PageHeader from '@/components/ui/PageHeader';
import { useChat } from "@/hooks/useChat";
import useChatStore from '@/hooks/useChatStore';
import { useHasMounted } from '@/hooks/useHasMounted';
import { Edit2 } from 'lucide-react';
export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { messages, input, handleInputChange, handleSubmit, isTyping, sendAudioMessage, sendFileMessage } = useChat(id);
  const { getChatById, toggleInfoPanel, isInfoPanelOpen, updateChatName } = useChatStore();
  const hasMounted = useHasMounted();
  const [isEditing, setIsEditing] = useState(false);
  const [editingName, setEditingName] = useState('');

  // Cerrar el panel de información cuando cambie el ID del chat
  useEffect(() => {
    if (isInfoPanelOpen) {
      toggleInfoPanel();
    }
  }, [id]); // Solo depende del ID del chat, no incluimos toggleInfoPanel para evitar loops

  const chat = getChatById(id);

  const handleEditStart = () => {
    if (chat) {
      setEditingName(chat.name);
      setIsEditing(true);
    }
  };

  const handleEditSave = () => {
    if (chat && editingName.trim()) {
      updateChatName(chat.id, editingName.trim());
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditingName('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  if (!hasMounted) {
    return null; // O un spinner de carga
  }

  const InfoButton = (
    <button onClick={toggleInfoPanel} className="p-2">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
    </button>
  );

  return (
    <div className="flex flex-col h-full max-h-full w-full overflow-x-hidden overflow-y-hidden">
      {/* Header fijo */}
      <div className="flex-shrink-0 w-full">
        <PageHeader actionSlot={InfoButton}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isEditing ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={handleKeyDown}
                onBlur={handleEditSave}
                className="flex-1 text-lg font-bold bg-transparent border-none outline-none focus:ring-0 p-0 m-0"
                autoFocus
              />
            ) : (
              <>
                <h1 className="text-lg font-bold truncate flex-1 min-w-0">
                  {chat?.name || 'Chat'}
                </h1>
                <button
                  onClick={handleEditStart}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors flex-shrink-0"
                >
                  <Edit2 size={16} className="text-gray-500" />
                </button>
              </>
            )}
          </div>
        </PageHeader>
      </div>
      
      {/* Área de mensajes con scroll */}
      <div className="flex-1 min-h-0 w-full overflow-x-hidden overflow-y-auto">
        <ChatMessages messages={messages} isTyping={isTyping} />
      </div>
      
      {/* Footer fijo */}
      <div className="flex-shrink-0 w-full">
        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          onSendAudio={sendAudioMessage}
          onSendFile={sendFileMessage}
        />
      </div>
      
      <ChatInfo chatId={id} />
    </div>
  );
}
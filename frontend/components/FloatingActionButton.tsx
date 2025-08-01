import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../contexts/ChatContext';
import PlusIcon from './icons/PlusIcon';

interface FloatingActionButtonProps {
  activeFilter: {
    type: 'folder' | 'tag' | null;
    value: string | null;
  };
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ activeFilter }) => {
  const { createChat } = useChatStore();
  const navigate = useNavigate();

  const handleNewChat = () => {
    const folderId = activeFilter.type === 'folder' ? activeFilter.value : null;
    const newChat = createChat(folderId);
    navigate(`/chat/${newChat.id}`);
  };

  return (
    <button
      onClick={handleNewChat}
      className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-20 bg-accent-green hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent-green"
      aria-label="Create new chat"
    >
      <PlusIcon className="w-8 h-8" />
    </button>
  );
};

export default FloatingActionButton;
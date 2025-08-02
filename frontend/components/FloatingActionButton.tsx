import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useChatStore } from '../contexts/ChatContext';
import PlusIcon from './icons/PlusIcon';

interface FloatingActionButtonProps {
  activeFilter: {
    type: 'folder' | 'tag' | null;
    value: string | null;
  };
}

const fabVariants = {
  initial: { scale: 0, opacity: 0, y: 20 },
  animate: { scale: 1, opacity: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
  exit: { scale: 0, opacity: 0, y: 20, transition: { duration: 0.2 } },
};

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ activeFilter }) => {
  const { createChat } = useChatStore();
  const navigate = useNavigate();

  const handleNewChat = () => {
    const folderId = activeFilter.type === 'folder' ? activeFilter.value : null;
    const newChat = createChat(folderId);
    navigate(`/chat/${newChat.id}`);
  };

  return (
    <motion.button
      variants={fabVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      onClick={handleNewChat}
      className="absolute bottom-6 right-6 md:bottom-8 md:right-8 z-20 bg-accent hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent"
      aria-label="Create new chat"
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.95 }}
    >
      <PlusIcon className="w-8 h-8" />
    </motion.button>
  );
};

export default FloatingActionButton;
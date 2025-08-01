
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BackIcon from './icons/BackIcon';
import EditIcon from './icons/EditIcon';
import { Chat, ChatMode } from '../types';
import PlusIcon from './icons/PlusIcon';

interface ChatHeaderProps {
  chat: Chat;
  onUpdateMode: (mode: ChatMode) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
  onRenameChat: (newTitle: string) => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ chat, onUpdateMode, onAddTag, onRemoveTag, onRenameChat }) => {
  const [tagInput, setTagInput] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(chat.title);
  
  useEffect(() => {
      setTitleValue(chat.title);
  }, [chat.title]);

  const handleAddTag = () => {
    if (tagInput.trim()) {
      onAddTag(tagInput.trim());
      setTagInput('');
    }
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (titleValue.trim()) {
      onRenameChat(titleValue.trim());
    } else {
        setTitleValue(chat.title); // revert if empty
    }
    setIsEditingTitle(false);
  };

  return (
    <header className="flex-shrink-0 bg-primary/80 backdrop-blur-sm p-4 border-b border-secondary min-w-0">
      <div className="flex items-center justify-between min-w-0">
        <div className="flex items-center min-w-0 group">
          <Link to="/" className="p-2 rounded-md hover:bg-secondary mr-2 flex-shrink-0">
            <BackIcon className="h-6 w-6 text-light" />
          </Link>
          {isEditingTitle ? (
            <form onSubmit={handleTitleSubmit} className="flex-1 min-w-0">
                 <input 
                    type="text" 
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={() => handleTitleSubmit(new Event('submit') as any)}
                    className="text-lg font-semibold text-light bg-secondary px-2 py-1 rounded-md w-full border border-accent-violet focus:ring-1 focus:ring-accent-violet min-w-0"
                    autoFocus
                />
            </form>
          ) : (
            <div onClick={() => setIsEditingTitle(true)} className="flex items-center gap-2 cursor-pointer min-w-0">
                <h1 className="text-lg font-semibold text-light truncate">{chat.title}</h1>
                <EditIcon className="w-4 h-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>
        <div className="flex items-center">
          <select 
            value={chat.mode} 
            onChange={(e) => onUpdateMode(e.target.value as ChatMode)}
            className="bg-secondary text-light text-sm rounded-md py-1 pl-2 pr-8 border border-transparent focus:border-accent-violet focus:ring-1 focus:ring-accent-violet"
            aria-label="Select chat mode"
          >
            <option value="chat">Mode: Chat</option>
            <option value="agent">Mode: Agent</option>
          </select>
        </div>
      </div>
      <div className="mt-3 ml-12 flex items-center gap-2 flex-wrap">
        {chat.tags.map(tag => (
          <div key={tag} className="flex items-center bg-secondary text-accent-violet text-xs font-semibold px-2 py-1 rounded-full">
            <span>#{tag}</span>
            <button onClick={() => onRemoveTag(tag)} className="ml-1.5 text-accent-violet/70 hover:text-light">
              &times;
            </button>
          </div>
        ))}
        <div className="group flex items-center bg-secondary rounded-md border border-secondary focus-within:border-accent-violet transition-colors">
            <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                placeholder="Add tag..."
                className="bg-transparent placeholder-muted text-light text-xs w-24 px-2 py-1 focus:outline-none"
            />
            <button onClick={handleAddTag} className="bg-transparent text-accent-violet text-xs py-1 px-1.5 hover:bg-primary/50 rounded-r-md">
                <PlusIcon className="w-3.5 h-3.5" />
            </button>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader;
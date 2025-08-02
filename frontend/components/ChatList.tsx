
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useChatStore } from '../contexts/ChatContext';
import { useSidebar } from '../contexts/SidebarContext';
import TrashIcon from './icons/TrashIcon';
import EditIcon from './icons/EditIcon';

interface ChatListProps {
  activeFilter: {
    type: 'folder' | 'tag' | null;
    value: string | null;
  };
}

const ChatList: React.FC<ChatListProps> = ({ activeFilter }) => {
  const { chats, deleteChat, renameChat } = useChatStore();
  const { closeSidebar } = useSidebar();
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if(window.confirm('Are you sure you want to delete this chat?')) {
        deleteChat(id);
    }
  };

  const handleEditClick = (e: React.MouseEvent, id: string, currentTitle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChatId(id);
    setNewTitle(currentTitle);
  };

  const handleRename = (e: React.FormEvent, id: string) => {
      e.preventDefault();
      if (newTitle.trim()) {
          renameChat(id, newTitle);
      }
      setEditingChatId(null);
      setNewTitle('');
  };

  const filteredChats = chats.filter(chat => {
    if (!activeFilter.type || !activeFilter.value) return true;
    if (activeFilter.type === 'folder') {
      return chat.folderId === activeFilter.value;
    }
    if (activeFilter.type === 'tag') {
      return chat.tags.includes(activeFilter.value);
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="flex-1 overflow-y-auto bg-primary min-w-0 overflow-x-hidden">
      {filteredChats.length > 0 ? (
        <ul className="divide-y divide-secondary">
          {filteredChats.map(chat => (
            <li key={chat.id} className="group grid grid-cols-[1fr_auto] items-center hover:bg-secondary transition-colors duration-200">
              {/* This div wrapper with overflow-hidden is crucial for forcing truncation inside the grid column. */}
              <div className="overflow-hidden">
                <Link
                    to={`/chat/${chat.id}`}
                    onClick={() => {
                        if (editingChatId === chat.id) return;
                        closeSidebar();
                    }}
                    className="block p-4"
                >
                    {editingChatId === chat.id ? (
                        <form onSubmit={(e) => handleRename(e, chat.id)}>
                            <input
                                type="text"
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onBlur={() => setEditingChatId(null)}
                                onClick={(e) => {e.preventDefault(); e.stopPropagation();}}
                                className="w-full bg-primary text-light font-semibold p-1 rounded-md border border-accent"
                                autoFocus
                            />
                        </form>
                    ) : (
                        <h3 className="font-semibold text-light truncate">{chat.title}</h3>
                    )}
                    <p className="text-sm text-muted truncate mt-1">
                    {chat.messages.length > 0
                        ? chat.messages[chat.messages.length - 1].content.startsWith('data:image') 
                            ? 'Image message'
                            : chat.messages[chat.messages.length - 1].content.replace(/\n/g, ' ')
                        : 'No messages yet...'}
                    </p>
                    {chat.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                            {chat.tags.map(tag => (
                                <span key={tag} className="text-xs bg-primary text-accent font-medium px-2 py-0.5 rounded-full">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </Link>
              </div>
              
              <div className="flex items-center ml-2 mr-4 flex-shrink-0">
                <button 
                    onClick={(e) => handleEditClick(e, chat.id, chat.title)} 
                    className="p-2 rounded-full text-muted hover:bg-accent/20 hover:text-accent opacity-60 group-hover:opacity-100 transition-opacity"
                    aria-label="Rename chat"
                >
                    <EditIcon className="w-5 h-5"/>
                </button>
                <button 
                    onClick={(e) => handleDelete(e, chat.id)} 
                    className="p-2 rounded-full text-muted hover:bg-danger/20 hover:text-danger opacity-60 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete chat"
                >
                    <TrashIcon className="w-5 h-5"/>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center p-10 text-muted">
          <p>No conversations found.</p>
          <p>Try changing your filter or creating a new chat.</p>
        </div>
      )}
    </div>
  );
};

export default ChatList;
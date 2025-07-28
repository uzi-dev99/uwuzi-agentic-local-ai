import React, { useState } from 'react';
import { useSidebar } from '../contexts/SidebarContext';
import { useChatStore } from '../contexts/ChatContext';
import PlusIcon from './icons/PlusIcon';
import FolderIcon from './icons/FolderIcon';
import TrashIcon from './icons/TrashIcon';
import { Link, useNavigate } from 'react-router-dom';

const Sidebar: React.FC<{
  activeFilter: { type: 'folder' | 'tag' | null; value: string | null };
  setActiveFilter: (filter: { type: 'folder' | 'tag' | null; value: string | null }) => void;
}> = ({ activeFilter, setActiveFilter }) => {
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const { folders, createFolder, deleteFolder, createChat, getUniqueTags } = useChatStore();
  const [newFolderName, setNewFolderName] = useState('');
  const navigate = useNavigate();
  const uniqueTags = getUniqueTags();

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
    }
  };
  
  const handleNewChat = () => {
    const currentFolderId = activeFilter.type === 'folder' ? activeFilter.value : null;
    const newChat = createChat(currentFolderId);
    navigate(`/chat/${newChat.id}`);
    closeSidebar();
  };

  const handleFilterClick = (type: 'folder' | 'tag' | null, value: string | null) => {
    setActiveFilter({ type, value });
    closeSidebar();
  };

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-30 md:hidden transition-opacity ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeSidebar}
      />
      <aside
        className={`absolute md:relative flex flex-col bg-primary w-64 md:w-72 h-full z-40 transform transition-transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 flex-shrink-0 border-r border-secondary`}
      >
        <div className="p-4 border-b border-secondary">
            <button
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 bg-accent-green hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
                <PlusIcon className="h-5 w-5" />
                New Chat
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <h2 className="text-sm font-semibold text-muted mb-2 px-2">Filters</h2>
              <ul className="space-y-1">
                 <li onClick={() => handleFilterClick(null, null)} className={`flex items-center gap-2 text-light hover:bg-secondary rounded-md p-2 cursor-pointer ${!activeFilter.type ? 'bg-accent-green/20' : ''}`}>
                    <span>All Chats</span>
                  </li>
              </ul>
            </div>
            
            <div>
              <h2 className="text-sm font-semibold text-muted mb-2 px-2">Folders</h2>
              <ul className="space-y-1">
                  {folders.map(folder => (
                      <li key={folder.id} onClick={() => handleFilterClick('folder', folder.id)} className={`group flex items-center justify-between text-light hover:bg-secondary rounded-md p-2 cursor-pointer ${activeFilter.type === 'folder' && activeFilter.value === folder.id ? 'bg-accent-green/20' : ''}`}>
                         <div className="flex items-center gap-2">
                           <FolderIcon className="h-5 w-5 text-accent-green"/>
                           <span>{folder.name}</span>
                         </div>
                         <button onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id)}} className="opacity-0 group-hover:opacity-100 text-muted hover:text-danger">
                           <TrashIcon className="h-4 w-4" />
                         </button>
                      </li>
                  ))}
              </ul>

              <div className="mt-4 px-2">
                  <input
                      type="text"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                      placeholder="New folder name..."
                      className="w-full bg-secondary text-light placeholder-muted p-2 rounded-md text-sm border border-transparent focus:border-accent-green focus:ring-0"
                  />
                   <button onClick={handleCreateFolder} className="w-full mt-2 text-sm bg-secondary hover:bg-primary text-light font-semibold py-1 px-3 rounded-md transition-colors">
                      Create Folder
                  </button>
              </div>
            </div>

            {uniqueTags.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-muted mb-2 px-2">Tags</h2>
                <div className="flex flex-wrap gap-2 px-2">
                  {uniqueTags.map(tag => (
                    <button key={tag} onClick={() => handleFilterClick('tag', tag)} className={`text-xs font-semibold py-1 px-2.5 rounded-full transition-colors ${activeFilter.type === 'tag' && activeFilter.value === tag ? 'bg-accent-green text-white' : 'bg-secondary hover:bg-primary text-light'}`}>
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>

        <div className="p-4 border-t border-secondary">
            <Link to="/config" onClick={closeSidebar} className="text-muted hover:text-light text-sm">
                Configuration
            </Link>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
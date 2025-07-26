'use client';

import React, { useState } from 'react';
import { useSidebar } from '@/context/SidebarContext';
import Link from 'next/link';
import useChatStore from '@/hooks/useChatStore';
import useFolderStore from '@/hooks/useFolderStore';
import FolderManager from '@/components/FolderManager';
import AddTagForm from './AddTagForm';
import { Tag, Folder, Settings } from 'lucide-react';

export default function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useSidebar();
  const { tags, activeTag, setActiveTag } = useChatStore();
  const { selectedFolderId, setSelectedFolderId } = useFolderStore();
  const [activeView, setActiveView] = useState<'folders' | 'tags'>('folders');

  const handleFolderSelect = (folderId: string | null) => {
    setSelectedFolderId(folderId);
    // Reset tag filter when changing folders
    setActiveTag('Todos');
  };

  return (
    <>
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-card border-r border-border transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out z-50 flex flex-col text-card-foreground`}
      >
        {/* Header with tabs */}
        <div className="p-4 border-b border-border">
          <div className="flex rounded-lg p-1">
            <button
              onClick={() => setActiveView('folders')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'folders'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-card-foreground hover:bg-muted'
              }`}
            >
              <Folder className="h-4 w-4" />
              Carpetas
            </button>
            <button
              onClick={() => setActiveView('tags')}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeView === 'tags'
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-card-foreground hover:bg-muted'
              }`}
            >
              <Tag className="h-4 w-4" />
              Tags
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-2 overflow-y-auto">
          {activeView === 'folders' ? (
            <FolderManager
              onFolderSelect={handleFolderSelect}
              selectedFolderId={selectedFolderId}
            />
          ) : (
            <>
              <button
                onClick={() => setActiveTag('Todos')}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  activeTag === 'Todos'
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-card-foreground'
                }`}
              >
                Todos
              </button>
              
              {tags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(tag)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    activeTag === tag
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted text-card-foreground'
                  }`}
                >
                  #{tag}
                </button>
              ))}
              
              <AddTagForm />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Link href="/config" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-card-foreground transition-colors">
            <Settings className="h-4 w-4" />
            <span>Configuración</span>
          </Link>
        </div>
      </aside>
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closeSidebar}
        ></div>
      )}
    </>
  );
}
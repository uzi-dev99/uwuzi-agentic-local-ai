import React from 'react';
import { useSidebar } from '@/context/SidebarContext';

const Sidebar: React.FC = () => {
  const { isOpen, closeSidebar } = useSidebar();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeSidebar}
        aria-hidden={!isOpen}
      />
      {/* Sidebar panel */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white dark:bg-secondary shadow-lg transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        aria-hidden={!isOpen}
      >
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900"
          onClick={closeSidebar}
        >
          ✕
        </button>
        {/* Aquí va el contenido del sidebar */}
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4">Menú</h2>
          {/* Agrega aquí los links o contenido que desees */}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

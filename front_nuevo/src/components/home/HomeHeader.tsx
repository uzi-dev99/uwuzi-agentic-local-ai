'use client';

import { useSidebar } from '@/context/SidebarContext';

export default function HomeHeader() {
  const { toggleSidebar, isSidebarOpen } = useSidebar();

  return (
    <header className="p-2 md:p-4 md:hidden border-b border-border">
      <div className="flex items-center px-1">
        <button 
          onClick={toggleSidebar} 
          className="h-10 w-10 flex items-center justify-center text-foreground"
        >
          {isSidebarOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
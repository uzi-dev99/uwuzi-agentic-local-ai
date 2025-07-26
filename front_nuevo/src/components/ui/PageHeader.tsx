"use client";

import { useRouter } from 'next/navigation';

import React from 'react';

interface PageHeaderProps {
  children: React.ReactNode;
  actionSlot?: React.ReactNode;
}

export default function PageHeader({ children, actionSlot }: PageHeaderProps) {
  const router = useRouter();
  

  return (
    <header className="p-2 md:p-4 border-b">
      <div className="flex items-center gap-2 px-1">
        <button 
          className="h-10 w-10 flex-shrink-0 flex items-center justify-center"
          onClick={() => router.back()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5"/>
            <path d="M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          {children}
        </div>
        {actionSlot && <div className="flex-shrink-0">{actionSlot}</div>}
      </div>
    </header>
  );
}
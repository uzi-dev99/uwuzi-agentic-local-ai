"use client";

import React from 'react';

export default function NewChatButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="py-4">
      <button onClick={onClick} className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14"/>
          <path d="M5 12h14"/>
        </svg>
        <span>Nuevo Chat</span>
      </button>
    </div>
  );
}
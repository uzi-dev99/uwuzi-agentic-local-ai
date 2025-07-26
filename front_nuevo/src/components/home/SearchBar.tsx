'use client';

import useChatStore from '@/hooks/useChatStore';

export default function SearchBar() {
  const { searchTerm, setSearchTerm } = useChatStore();

  return (
    <div className="relative mt-4">
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Buscar chats..."
        className="w-full p-3 pl-10 bg-card text-foreground rounded-lg border border-border focus:border-ring focus:outline-none transition-colors"
      />
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    </div>
  );
}
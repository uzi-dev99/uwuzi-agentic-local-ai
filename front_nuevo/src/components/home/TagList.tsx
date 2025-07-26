"use client";

import React from 'react';

interface TagListProps {
  tags: string[];
  activeTag: string;
  setActiveTag: (tag: string) => void;
}

export default function TagList({ tags, activeTag, setActiveTag }: TagListProps) {
  const allTags = ['Todos', ...tags];

  return (
    <div className="flex items-center gap-2 mt-4 overflow-x-auto pb-2">
      {allTags.map((tag) => {
        const isActive = tag === activeTag;
        return (
          <button 
            key={tag}
            onClick={() => setActiveTag(tag)}
            className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors whitespace-nowrap ${
              isActive 
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-secondary'
            }`}>
            {tag}
          </button>
        );
      })}
    </div>
  );
}
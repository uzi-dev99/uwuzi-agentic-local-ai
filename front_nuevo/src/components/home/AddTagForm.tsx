'use client';

import { useState } from 'react';
import useChatStore from '@/hooks/useChatStore';

export default function AddTagForm() {
  const [newTag, setNewTag] = useState('');
  const { addNewTag } = useChatStore();

  const handleAddTag = () => {
    if (newTag.trim()) {
      addNewTag(newTag.trim());
      setNewTag('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    }
  };

  return (
    <div className="mt-4 flex items-center gap-2">
      <input
        type="text"
        value={newTag}
        onChange={(e) => setNewTag(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="Nuevo tag"
        className="flex-1 p-2 bg-input text-foreground rounded border border-border focus:border-ring focus:outline-none"
      />
      <button
        onClick={handleAddTag}
        className="px-3 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
      >
        +
      </button>
    </div>
  );
}
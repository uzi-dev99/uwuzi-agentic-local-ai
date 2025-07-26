'use client';

import useChatStore from '@/hooks/useChatStore';

interface TagAssignmentMenuProps {
  chatId: string;
  chatTags: string[];
  isOpen: boolean;
  onClose: () => void;
}

export default function TagAssignmentMenu({ chatId, chatTags, isOpen, onClose }: TagAssignmentMenuProps) {
  const { tags: allTags, addTagToChat, removeTagFromChat } = useChatStore();

  const toggleTag = (tag: string) => {
    if (chatTags.includes(tag)) {
      removeTagFromChat(chatId, tag);
    } else {
      addTagToChat(chatId, tag);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay para cerrar el menú */}
      <div 
        className="fixed inset-0 z-10" 
        onClick={onClose}
      />
      
      {/* Menú desplegable */}
      <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20">
        <div className="p-2">
          <p className="text-xs text-muted-foreground mb-2">Asignar tags:</p>
          <ul className="space-y-1 max-h-32 overflow-y-auto">
            {allTags.map((tag) => (
              <li key={tag}>
                <label className="flex items-center p-1 hover:bg-muted rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={chatTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                    className="mr-2 accent-primary"
                  />
                  <span className="text-sm text-foreground">{tag}</span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
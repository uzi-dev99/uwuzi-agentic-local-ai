import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Trash2 } from 'lucide-react';
import type { Chat } from '@/types/chat';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import TagEditor from '@/components/TagEditor';
import { Button } from '@/components/ui/button';
import { useVirtualizer } from '@tanstack/react-virtual'; // Added

interface ChatListProps {
    isLoading: boolean;
    chats: Chat[];
    selectedFolderId: string | null;
    handleDeleteChat: (chatId: string, e: React.MouseEvent) => void;
    handleUpdateTags: (chatId: string, newTags: string[]) => void;
    toggleTagFilter: (tag: string) => void;
}

const ChatList: React.FC<ChatListProps> = ({ 
    isLoading, 
    chats, 
    selectedFolderId, 
    handleDeleteChat, 
    handleUpdateTags,
    toggleTagFilter
}) => {
    const navigate = useNavigate();
    const parentRef = React.useRef<HTMLDivElement>(null); // Added

    const rowVirtualizer = useVirtualizer({ // Added
        count: chats.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 130, // Adjusted estimate
        overscan: 5,
    });

    if (isLoading) {
        // Skeleton loading remains the same
        return (
            <div className="space-y-4 custom-scrollbar">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-secondary/50 rounded-xl p-4">
                        <div className="flex justify-between items-start">
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (chats.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center text-center py-16">
              <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl text-muted-foreground">
                {selectedFolderId ? "No hay conversaciones en esta carpeta." : "Aún no tienes conversaciones."}
              </p>
              <p className="text-muted-foreground">¡Crea una para empezar!</p>
            </div>
        );
    }

    return (
        <div
            ref={parentRef}
            className="custom-scrollbar max-h-[calc(100vh-12rem)] overflow-y-auto relative"
        >
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {/* Nuevo wrapper flex para centrar los items */}
                <div className="flex flex-col items-center w-full absolute top-0 left-0" style={{ height: '100%' }}>
                    {rowVirtualizer.getVirtualItems().map(virtualRow => {
                        const chat = chats[virtualRow.index];
                        return (
                            <div
                                key={chat.id}
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: `${virtualRow.size}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                    padding: '0.5rem 0',
                                    display: 'flex',
                                    justifyContent: 'center',
                                }}
                                className="px-1"
                            >
                                {/* Limitar ancho y centrar el chat item */}
                                <div className="bg-secondary/50 backdrop-blur-sm rounded-xl p-4 hover:bg-secondary/70 active:bg-secondary/80 transition-colors border border-border/50 group h-full flex flex-col justify-between w-full max-w-xl mx-auto">
                                    <div
                                        className="cursor-pointer"
                                        onClick={() => navigate(`/?view=chat&id=${chat.id}&folderId=${chat.folderId || ''}`)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-lg mb-1 truncate">{chat.title}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    {chat.messages.length} mensajes • {new Date(chat.createdAt).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-0 flex justify-between items-end" style={{ marginTop: '-8px' }}>
                                        <div className="flex flex-wrap gap-1 items-center overflow-hidden" onClick={(e) => e.stopPropagation()}>
                                            {(chat.tags && chat.tags.length > 0) ? (
                                                chat.tags.slice(0, 3).map(tag => (
                                                    <Badge key={tag} variant="outline" className="cursor-pointer whitespace-nowrap" onClick={() => toggleTagFilter(tag)}>{tag}</Badge>
                                                ))
                                            ) : (
                                                <p className="text-sm text-muted-foreground italic">Sin tags</p>
                                            )}
                                            {chat.tags && chat.tags.length > 3 && (
                                               <Badge variant="outline">...</Badge>
                                            )}
                                        </div>

                                        <div className="flex items-center flex-shrink-0">
                                            <div onClick={(e) => e.stopPropagation()}>
                                                <TagEditor
                                                    tags={chat.tags || []}
                                                    onUpdateTags={(newTags) => handleUpdateTags(chat.id, newTags)}
                                                />
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={(e) => handleDeleteChat(chat.id, e)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default ChatList;


import * as React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ChatFiltersProps {
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    allTags: string[];
    selectedTags: string[];
    toggleTagFilter: (tag: string) => void;
    clearTagFilters: () => void;
}

const ChatFilters: React.FC<ChatFiltersProps> = ({
    searchTerm,
    setSearchTerm,
    allTags,
    selectedTags,
    toggleTagFilter,
    clearTagFilters,
}) => {
    return (
        <div className="mb-6 space-y-4">
            <Input 
                placeholder="Buscar por título o tag..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
            {allTags.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-sm font-medium self-center text-muted-foreground">Filtrar:</span>
                    {allTags.map(tag => (
                        <Button
                            key={tag}
                            variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleTagFilter(tag)}
                            className="h-7"
                        >
                            {tag}
                        </Button>
                    ))}
                    {selectedTags.length > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearTagFilters}
                            className="h-7 text-muted-foreground"
                        >
                            Limpiar filtros
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatFilters;

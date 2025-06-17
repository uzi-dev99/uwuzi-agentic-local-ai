
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Pencil, Check, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface ChatHeaderProps {
    chatId: string | null;
    chatTitle: string;
    onSaveTitle: (newTitle: string) => boolean;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ chatId, chatTitle, onSaveTitle }) => {
    const navigate = useNavigate();
    const [isEditingTitle, setIsEditingTitle] = React.useState(false);
    const [tempTitle, setTempTitle] = React.useState(chatTitle);
    
    React.useEffect(() => {
        setTempTitle(chatTitle);
    }, [chatTitle]);

    const handleSave = () => {
        if (onSaveTitle(tempTitle)) {
            setIsEditingTitle(false);
        }
    };

    const handleCancel = () => {
        setIsEditingTitle(false);
        setTempTitle(chatTitle);
    };
    
    return (
        <header className="flex-shrink-0 flex items-center p-2 md:p-4 border-b border-border/50 bg-secondary/50 backdrop-blur-sm z-10">
            <Button variant="primary-ghost" size="icon" onClick={() => navigate('/?view=home')}>
                <ArrowLeft />
            </Button>
            <div className="ml-2 md:ml-4 flex-1">
                {isEditingTitle ? (
                    <div className="flex items-center gap-2 max-w-sm">
                        <Input
                            value={tempTitle}
                            onChange={(e) => setTempTitle(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                            }}
                            autoFocus
                        />
                        <Button variant="primary-ghost" size="icon" className="h-9 w-9" onClick={handleSave}>
                            <Check className="h-4 w-4" />
                        </Button>
                        <Button variant="primary-ghost" size="icon" className="h-9 w-9" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 group">
                        <h1 className="text-lg font-bold truncate">{chatTitle}</h1>
                        <Button variant="primary-ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditingTitle(true)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <p className="text-xs md:text-sm text-muted-foreground">ID: {chatId}</p>
            </div>
        </header>
    );
}

export default ChatHeader;

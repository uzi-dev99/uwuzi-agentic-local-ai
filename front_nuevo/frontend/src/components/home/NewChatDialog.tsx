import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface NewChatDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateChat: (name: string) => void;
}

const NewChatDialog: React.FC<NewChatDialogProps> = ({ open, onOpenChange, onCreateChat }) => {
    const [chatName, setChatName] = React.useState('');

    const handleCreate = () => {
        const name = chatName.trim() || 'Nueva Conversación';
        onCreateChat(name);
        setChatName('');
        onOpenChange(false);
    };

    const handleCancel = () => {
        setChatName('');
        onOpenChange(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleCreate();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crear Nuevo Chat</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="chat-name">Nombre del chat</Label>
                        <Input
                            id="chat-name"
                            value={chatName}
                            onChange={(e) => setChatName(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ingresa el nombre del chat..."
                            autoFocus
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancelar
                    </Button>
                    <Button onClick={handleCreate}>
                        Crear Chat
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default NewChatDialog;
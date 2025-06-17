
import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface ProcessMonitorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProcessMonitorDialog: React.FC<ProcessMonitorDialogProps> = ({ open, onOpenChange }) => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const userId = currentUser!.id;

    const { data: activeProcesses, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['chats', userId, 'activeProcesses'],
        queryFn: async () => {
            const allChats = await api.fetchChats(userId);
            return allChats.filter(chat => chat.isWaitingLongResponse);
        },
        enabled: !!userId && open,
    });
    
    const handleGoToChat = (chatId: string) => {
        onOpenChange(false);
        navigate(`/chat?id=${chatId}`);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                        <span>Monitor de Procesos</span>
                        <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading || isRefetching} className="h-8 w-8">
                            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
                        </Button>
                    </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1 -mr-2 pr-4">
                    {isLoading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <Skeleton className="h-6 w-3/4 mb-2" />
                                    <Skeleton className="h-4 w-1/2" />
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-8 w-28" />
                                </CardContent>
                            </Card>
                        ))
                    ) : activeProcesses && activeProcesses.length > 0 ? (
                        activeProcesses.map(chat => (
                            <Card key={chat.id}>
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between">
                                        <span className="truncate pr-4">{chat.title}</span>
                                        <Badge variant="default" className="flex-shrink-0">Activo</Badge>
                                    </CardTitle>
                                    <CardDescription>Iniciado en: {new Date(chat.createdAt).toLocaleString()}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground truncate">ID del Chat: {chat.id}</p>
                                    <Button size="sm" className="mt-4" onClick={() => handleGoToChat(chat.id)}>
                                        Ir al Chat
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        <Card>
                            <CardContent className="p-6 text-center">
                                <p className="text-muted-foreground">No hay procesos de agente activos en este momento.</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProcessMonitorDialog;

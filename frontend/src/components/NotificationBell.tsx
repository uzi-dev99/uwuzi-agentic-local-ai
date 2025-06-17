
import * as React from 'react';
import { useNotifications } from '@/context/NotificationContext';
import { Button } from '@/components/ui/button';
import { Bell, BellOff } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const NotificationBell = () => {
    const { permission, requestPermission } = useNotifications();

    const getTooltipText = () => {
        switch (permission) {
            case 'granted':
                return 'Notificaciones activadas';
            case 'denied':
                return 'Notificaciones bloqueadas';
            default:
                return 'Activar notificaciones';
        }
    };

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={requestPermission} disabled={permission === 'denied'}>
                    {permission === 'granted' ? <Bell className="h-5 w-5 text-accent-foreground" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
                </Button>
            </TooltipTrigger>
            <TooltipContent>
                <p>{getTooltipText()}</p>
            </TooltipContent>
        </Tooltip>
    );
};

export default NotificationBell;

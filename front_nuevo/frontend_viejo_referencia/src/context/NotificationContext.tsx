
import * as React from 'react';
import { toast } from 'sonner';

type NotificationContextType = {
    permission: NotificationPermission;
    requestPermission: () => Promise<boolean>;
    sendNotification: (title: string, options?: NotificationOptions) => void;
};

const NotificationContext = React.createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [permission, setPermission] = React.useState<NotificationPermission>('default');

    React.useEffect(() => {
        if ('Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = React.useCallback(async () => {
        if (!('Notification' in window)) {
            toast.error('Este navegador no soporta notificaciones de escritorio.');
            return false;
        }

        if (Notification.permission === 'denied') {
            toast.info('Las notificaciones están bloqueadas. Habilítalas en la configuración de tu navegador.');
            return false;
        }
        
        if (Notification.permission === 'granted') {
            toast.info('Las notificaciones ya están activadas.');
            return true;
        }

        const result = await Notification.requestPermission();
        setPermission(result);

        if (result === 'granted') {
            toast.success('¡Notificaciones activadas!');
            new Notification('Wuzi Assist', {
                body: 'Ahora recibirás notificaciones.',
                icon: '/favicon.ico'
            });
            return true;
        } else {
            toast.info('No has permitido las notificaciones.');
            return false;
        }
    }, []);

    const sendNotification = React.useCallback((title: string, options?: NotificationOptions) => {
        if (Notification.permission !== 'granted') {
            console.log('No se pueden enviar notificaciones, permiso denegado o no solicitado.');
            return;
        }
        new Notification(title, { ...options, icon: '/favicon.ico' });
    }, []);

    const value = { permission, requestPermission, sendNotification };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = React.useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

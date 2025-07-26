
import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, XCircle } from 'lucide-react';

interface LongProcessIndicatorProps {
    onCancel: () => void;
}

const LongProcessIndicator: React.FC<LongProcessIndicatorProps> = ({ onCancel }) => {
    return (
        <div className="flex flex-col items-center justify-center gap-4 p-4 my-4 bg-secondary/50 border border-border/50 rounded-lg animate-fade-in">
            <div className="flex items-center gap-2 text-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                <p className="text-sm font-medium">Procesando solicitud de agente...</p>
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
                Esto puede tardar varios minutos. Puedes cerrar esta ventana, te notificaremos cuando esté listo.
            </p>
            <Button variant="destructive" size="sm" onClick={onCancel}>
                <XCircle className="mr-2 h-4 w-4" />
                Detener proceso
            </Button>
        </div>
    );
};

export default LongProcessIndicator;

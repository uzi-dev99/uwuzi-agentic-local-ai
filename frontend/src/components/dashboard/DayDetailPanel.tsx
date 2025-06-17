
import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import HabitTracker from './HabitTracker';

interface DayDetailPanelProps {
    date: Date;
    onClose: () => void;
}

const DayDetailPanel: React.FC<DayDetailPanelProps> = ({ date, onClose }) => {
    const formattedDate = format(date, "EEEE, d 'de' MMMM", { locale: es });

    return (
        <Card className="flex flex-col h-full">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="text-lg capitalize">{formattedDate}</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </CardHeader>
            <CardContent className="flex-1 pt-0">
                <HabitTracker date={date} />
            </CardContent>
        </Card>
    );
};

export default DayDetailPanel;

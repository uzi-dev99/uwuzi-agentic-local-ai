
import * as React from 'react';
import DashboardCard from './DashboardCard';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useHabits } from '@/hooks/useHabits.tsx';

interface CalendarWidgetProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({ selectedDate, onDateSelect }) => {
  const { getHabitCompletionStatusByDay } = useHabits();
  const { one, two, all } = getHabitCompletionStatusByDay();

  return (
    <DashboardCard title="Calendario" titleIcon={<CalendarIcon />}>
      <div className="flex items-center h-full">
        <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            className="rounded-md border w-full"
            modifiers={{ 
                one_habit: one,
                two_habits: two,
                all_habits: all
            }}
            modifiersClassNames={{
              one_habit: 'bg-amber-200/50 dark:bg-amber-800/50 hover:bg-amber-200/70',
              two_habits: 'bg-orange-300/60 dark:bg-orange-700/60 hover:bg-orange-300/80',
              all_habits: 'bg-green-400/70 dark:bg-green-600/70 hover:bg-green-400/90',
            }}
            classNames={{
                day: "h-12 w-12 text-base rounded-md",
                head_cell: "text-base flex-1 text-center",
                cell: "flex-1 flex justify-center items-center p-0",
                row: "flex w-full mt-2",
                caption_label: "text-xl",
                nav_button: "h-8 w-8",
            }}
        />
      </div>
    </DashboardCard>
  );
};

export default CalendarWidget;

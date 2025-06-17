
import * as React from 'react';
import { useHabits, predefinedHabits } from '@/hooks/useHabits.tsx';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface HabitTrackerProps {
  date: Date;
}

const HabitTracker: React.FC<HabitTrackerProps> = ({ date }) => {
  const { getHabitStatus, toggleHabit } = useHabits();

  return (
    <div className="space-y-3">
      {predefinedHabits.map((habit) => {
        const isChecked = getHabitStatus(habit.id, date);
        const uniqueId = `habit-${habit.id}-${date.toISOString()}`;
        return (
          <label
            key={habit.id}
            htmlFor={uniqueId}
            className={cn(
              "flex items-center justify-between p-4 rounded-lg border transition-colors cursor-pointer",
              isChecked ? "bg-primary/10 border-primary text-primary" : "bg-card hover:bg-muted/50"
            )}
          >
            <div className="flex items-center gap-4">
              {habit.icon}
              <span id={`habit-label-${habit.id}`} className="font-medium text-card-foreground">
                {habit.name}
              </span>
            </div>
            <Checkbox
              id={uniqueId}
              checked={isChecked}
              onCheckedChange={() => toggleHabit(habit.id, date)}
              className="h-6 w-6"
              aria-labelledby={`habit-label-${habit.id}`}
            />
          </label>
        );
      })}
    </div>
  );
};

export default HabitTracker;

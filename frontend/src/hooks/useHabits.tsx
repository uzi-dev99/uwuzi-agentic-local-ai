import * as React from 'react';
import { useLocalStorage } from './useLocalStorage';
import { format, parseISO } from 'date-fns';
import { Dumbbell, Apple, Ban } from 'lucide-react';
import { Habit, HabitLog } from '@/types/habit';

export const predefinedHabits: Habit[] = [
  { id: 'exercise', name: 'Ejercicio', icon: <Dumbbell className="h-6 w-6" /> },
  { id: 'healthy-food', name: 'Comida Saludable', icon: <Apple className="h-6 w-6" /> },
  { id: 'no-drugs', name: 'No-drugs', icon: <Ban className="h-6 w-6" /> },
];

export const useHabits = () => {
  const [habitLog, setHabitLog] = useLocalStorage<HabitLog>('habit-log', {});

  const toggleHabit = (habitId: string, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    setHabitLog(prevLog => {
      const newLog = { ...prevLog };
      if (!newLog[dateKey]) {
        newLog[dateKey] = {};
      }
      newLog[dateKey][habitId] = !newLog[dateKey][habitId];
      return newLog;
    });
  };

  const getHabitStatus = (habitId: string, date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return !!(habitLog[dateKey] && habitLog[dateKey][habitId]);
  };

  const getHabitCompletionStatusByDay = () => {
    const completionStatus: { one: Date[], two: Date[], all: Date[] } = {
        one: [],
        two: [],
        all: [],
    };
    if (!habitLog) return completionStatus;

    Object.keys(habitLog).forEach(dateStr => {
        const dayLog = habitLog[dateStr];
        if (!dayLog) return;

        const completedHabitsCount = predefinedHabits.reduce((count, habit) => {
            return dayLog[habit.id] ? count + 1 : count;
        }, 0);
        
        if (completedHabitsCount > 0) {
            const date = parseISO(dateStr);
            if (completedHabitsCount === 1) {
                completionStatus.one.push(date);
            } else if (completedHabitsCount === 2) {
                completionStatus.two.push(date);
            } else if (completedHabitsCount === predefinedHabits.length) {
                completionStatus.all.push(date);
            }
        }
    });
    return completionStatus;
  };

  return {
    getHabitStatus,
    toggleHabit,
    getHabitCompletionStatusByDay,
  };
};

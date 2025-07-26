
import * as React from 'react';

export interface Habit {
  id: string;
  name: string;
  icon: React.ReactNode;
}

export interface HabitLog {
  [date: string]: {
    [habitId: string]: boolean;
  };
}

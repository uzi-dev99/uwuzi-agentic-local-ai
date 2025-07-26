
import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ExpenseData } from '@/types/expense';

export const useExpenseData = () => {
    const [chartData, setChartData] = useState<ExpenseData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            const data: ExpenseData[] = Array.from({ length: 30 }, (_, i) => ({
                date: format(subDays(new Date(), 29 - i), 'd MMM', { locale: es }),
                gastos: Math.floor(Math.random() * 2000) + 500,
            }));
            setChartData(data);
            setIsLoading(false);
        }, 1500); // Simulamos 1.5 segundos de carga

        return () => clearTimeout(timer);
    }, []);

    return { chartData, isLoading };
};

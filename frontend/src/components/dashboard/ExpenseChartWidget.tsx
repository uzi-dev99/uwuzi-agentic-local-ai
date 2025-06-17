
import * as React from 'react';
import DashboardCard from './DashboardCard';
import { BarChart as BarChartIcon } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useExpenseData } from '@/hooks/useExpenseData';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfig = {
  gastos: {
    label: "Gastos",
    color: "hsl(var(--primary))",
  },
} satisfies ChartConfig;

const ExpenseChartWidget: React.FC = () => {
  const { chartData, isLoading } = useExpenseData();

  return (
    <DashboardCard title="Gastos (Últimos 30 días)" titleIcon={<BarChartIcon />}>
        {isLoading ? (
            <div className="flex flex-col justify-between h-[300px] w-full p-1">
                <Skeleton className="h-[90%] w-full" />
                <div className="flex justify-between px-2">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-4 w-8" />)}
                </div>
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="h-[300px] w-full flex-1">
                <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                        dataKey="date"
                        tickLine={false}
                        tickMargin={10}
                        axisLine={false}
                        tickFormatter={(value, index) => index % 5 === 0 ? value : ''}
                    />
                    <YAxis
                        tickFormatter={(value) => `$${Number(value) / 1000}k`}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="dot" />}
                    />
                    <Bar dataKey="gastos" fill="var(--color-gastos)" radius={4} />
                </BarChart>
            </ChartContainer>
        )}
    </DashboardCard>
  );
};

export default ExpenseChartWidget;

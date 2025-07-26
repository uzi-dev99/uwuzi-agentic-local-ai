
import * as React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface DashboardCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  titleIcon?: React.ReactNode;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, children, className, titleIcon }) => {
  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
            {titleIcon}
            {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        {children}
      </CardContent>
    </Card>
  );
};

export default DashboardCard;

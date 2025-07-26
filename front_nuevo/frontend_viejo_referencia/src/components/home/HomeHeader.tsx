import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NotificationBell from '@/components/NotificationBell';

interface HomeHeaderProps {
  folderName: string;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ folderName }) => {
  const navigate = useNavigate();

  return (
    <div className="flex justify-between items-center mb-4 px-4 py-2 border-b w-full overflow-x-hidden">
      <div className="flex items-center gap-1 sm:gap-2">
        <SidebarTrigger className="h-7 w-7 lg:hidden" />
        <h1 className="text-lg sm:text-xl font-semibold">{folderName}</h1>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        <NotificationBell />
        <Button 
          variant="ghost" 
          onClick={() => navigate('/?view=settings')}
        >
          Configuración
        </Button>
      </div>
    </div>
  );
};

export default HomeHeader;

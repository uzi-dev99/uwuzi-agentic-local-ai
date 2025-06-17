
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
    <div className="flex justify-between items-center mb-4 p-4 border-b"> {/* Added p-4 and border-b to match example styling */}
      <div className="flex items-center gap-2">
        <SidebarTrigger className="lg:hidden" /> {/* Added lg:hidden */}
        <h1 className="text-xl font-semibold">{folderName}</h1> {/* Adjusted text size and weight, removed flex-1, text-center, mx-4 */}
      </div>
      <div className="flex items-center gap-2">
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


import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import NotificationBell from '@/components/NotificationBell';

const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();

  return (
    <header className="flex items-center justify-between p-4 border-b bg-card"> {/* Adjusted classes to match example */}
      <div className="flex items-center gap-2"> {/* Added wrapper div */}
        <SidebarTrigger className="lg:hidden" /> {/* Added lg:hidden */}
        <h1 className="text-xl font-semibold">Dashboard</h1> {/* Adjusted text size, weight, removed flex-1 */}
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
    </header>
  );
};

export default DashboardHeader;

import * as React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import HomeView from '@/views/HomeView';
import ChatView from '@/views/ChatView';
import SettingsView from '@/views/SettingsView';
import { useAuth } from '@/hooks/useAuth';
import DashboardView from '@/views/DashboardView';

const Index = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, login, logout } = useAuth();
  const [selectedFolderId, setSelectedFolderId] = React.useState<string | null>(null);
  
  const view = searchParams.get('view');

  React.useEffect(() => {
    const syncLogout = (event: StorageEvent) => {
      if (event.key === 'wuzi-assist-logged-in' && event.newValue === null) {
        logout();
      }
    };
    window.addEventListener('storage', syncLogout);
    
    if (!currentUser) {
        login();
    }
    
    if (currentUser && !view) {
        navigate('/?view=home', { replace: true });
    }

    return () => {
      window.removeEventListener('storage', syncLogout);
    };
  }, [navigate, currentUser, view, login, logout]);

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold">Iniciando...</h1>
      </div>
    );
  }

  const renderView = () => {
    switch (view) {
      case 'chat':
        return <ChatView />;
      case 'settings':
        return <SettingsView />;
      case 'dashboard':
        return <DashboardView selectedFolderId={selectedFolderId} setSelectedFolderId={setSelectedFolderId} />;
      case 'home':
      default:
        // If logged in but no view specified, go to home
        if (!view) navigate('/?view=home', { replace: true });
        return <HomeView selectedFolderId={selectedFolderId} setSelectedFolderId={setSelectedFolderId} />;
    }
  };

  return (
    <div>
      {renderView()}
    </div>
  );
};

export default Index;

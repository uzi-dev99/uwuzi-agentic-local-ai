
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { SidebarProvider } from './contexts/SidebarContext';
import { ChatProvider } from './contexts/ChatContext';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ConfigPage from './pages/ConfigPage';
import Sidebar from './components/Sidebar';

const AppContent: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<{ type: 'folder' | 'tag' | null; value: string | null }>({ type: null, value: null });
  const location = useLocation();
  const navigate = useNavigate();
  const backPressCount = useRef(0);

  useEffect(() => {
    // This is a conceptual implementation for the browser environment.
    // In a real Capacitor app, you would use App.addListener('backButton', ...)
    const handleBackButton = (e: PopStateEvent) => {
      e.preventDefault(); // Prevent default browser back behavior

      if (location.pathname.startsWith('/chat/')) {
        navigate('/');
      } else if (location.pathname === '/') {
        backPressCount.current += 1;

        if (backPressCount.current === 2) {
          // In a real app, this would be App.exitApp();
          console.log('App would exit now.'); 
          // Reset for demonstration purposes
          backPressCount.current = 0; 
        } else {
          // In a real app, you'd show a Toast notification
          console.log('Press back again to exit.');
          setTimeout(() => {
            backPressCount.current = 0;
          }, 2000); // Reset after 2 seconds
        }
      }
    };

    // We use a custom event to simulate the back button press for now
    const customBackButtonHandler = () => handleBackButton(new PopStateEvent('popstate'));
    window.addEventListener('custom-back-button', customBackButtonHandler);

    // Cleanup
    return () => {
      window.removeEventListener('custom-back-button', customBackButtonHandler);
    };
  }, [location, navigate]);

  return (
    <div className="dark bg-primary text-light font-sans antialiased h-screen w-screen flex overflow-hidden overflow-x-hidden">
      <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      <main className="flex-1 flex flex-col h-full relative overflow-x-hidden">
        <Routes>
          <Route path="/" element={<HomePage activeFilter={activeFilter} />} />
          <Route path="/chat/:id" element={<ChatPage />} />
          <Route path="/config" element={<ConfigPage />} />
        </Routes>
      </main>
    </div>
  );
}

const App: React.FC = () => {
  return (
    <ChatProvider>
      <SidebarProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </SidebarProvider>
    </ChatProvider>
  );
};

export default App;

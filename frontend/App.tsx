
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';

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
    const setFullScreen = async () => {
      try {
        await StatusBar.hide();
      } catch (error) {
        console.log('StatusBar plugin not available, running in web.');
      }
    };

    setFullScreen();
  }, []);

  useEffect(() => {
    const handleBackButton = () => {
      if (location.pathname.startsWith('/chat/')) {
        navigate('/');
      } else if (location.pathname === '/') {
        backPressCount.current += 1;

        if (backPressCount.current === 2) {
          CapacitorApp.exitApp();
        } else {
          // Show toast notification: "Press back again to exit"
          console.log('Press back again to exit.');
          // TODO: Implement actual toast notification
          setTimeout(() => {
            backPressCount.current = 0;
          }, 2000); // Reset after 2 seconds
        }
      }
    };

    let backButtonListener: any;

    // Setup listeners
    const setupListeners = async () => {
      try {
        // Listen for native Android back button
        backButtonListener = await CapacitorApp.addListener('backButton', handleBackButton);
      } catch (error) {
        console.log('Capacitor App listener not available (web environment)');
      }
    };

    setupListeners();

    // Fallback for browser environment - custom event simulation
    const customBackButtonHandler = () => handleBackButton();
    window.addEventListener('custom-back-button', customBackButtonHandler);

    // Cleanup
    return () => {
      if (backButtonListener) {
        backButtonListener.remove();
      }
      window.removeEventListener('custom-back-button', customBackButtonHandler);
    };
  }, [location, navigate]);

  return (
    <div className="dark bg-primary text-light font-sans antialiased h-screen w-screen flex">
      <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
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

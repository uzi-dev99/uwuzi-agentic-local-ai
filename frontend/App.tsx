
import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { SidebarProvider } from './contexts/SidebarContext';
import { ChatProvider } from './contexts/ChatContext';
import HomePage from './pages/HomePage';
import ChatPage from './pages/ChatPage';
import ConfigPage from './pages/ConfigPage';
import Sidebar from './components/Sidebar';

const AppContent: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<{ type: 'folder' | 'tag' | null; value: string | null }>({ type: null, value: null });

  return (
    <div className="dark bg-primary text-light font-sans antialiased h-screen w-screen flex overflow-hidden">
      <Sidebar activeFilter={activeFilter} setActiveFilter={setActiveFilter} />
      <main className="flex-1 flex flex-col h-full relative">
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

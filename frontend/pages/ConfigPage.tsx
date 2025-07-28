

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BackIcon from '../components/icons/BackIcon';
import { useChatStore } from '../contexts/ChatContext';

const ConfigPage: React.FC = () => {
    const { clearAllData } = useChatStore();
    const navigate = useNavigate();

    const handleClearData = () => {
        if (window.confirm('Are you sure you want to delete all folders and conversations? This action cannot be undone.')) {
            clearAllData();
            alert('All data has been cleared.');
            navigate('/');
        }
    }

  return (
    <div className="h-full w-full flex flex-col bg-primary text-light">
      <header className="flex-shrink-0 bg-secondary/80 backdrop-blur-sm p-4 flex items-center border-b border-primary">
        <Link to="/" className="p-2 rounded-md hover:bg-primary mr-2">
          <BackIcon className="h-6 w-6 text-light" />
        </Link>
        <h1 className="text-lg font-semibold text-light truncate">Configuration</h1>
      </header>

      <main className="flex-1 p-6 space-y-8">
        <div>
            <h2 className="text-xl font-bold mb-4">Data Management</h2>
            <div className="bg-secondary p-4 rounded-lg">
                <p className="text-muted mb-4">
                    This will permanently delete all your folders, chats, and messages.
                </p>
                <button 
                    onClick={handleClearData}
                    className="bg-danger hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                >
                    Clear All Data
                </button>
            </div>
        </div>

         <div>
            <h2 className="text-xl font-bold mb-4">About</h2>
            <div className="bg-secondary p-4 rounded-lg text-muted">
                <p><strong className="text-light">App Name:</strong> Wuzi Chat AI</p>
                <p><strong className="text-light">Version:</strong> 1.0.0</p>
                <p className="mt-2">A high-performance chat interface built with React, TypeScript, and Tailwind CSS, powered by a custom backend agent.</p>
            </div>
        </div>
      </main>
    </div>
  );
};

export default ConfigPage;

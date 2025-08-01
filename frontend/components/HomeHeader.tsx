import React from 'react';
import { useSidebar } from '../contexts/SidebarContext';
import MenuIcon from './icons/MenuIcon';
import { Link } from 'react-router-dom';

interface HomeHeaderProps {
  title: string;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ title }) => {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="flex-shrink-0 bg-secondary/50 backdrop-blur-sm p-4 flex items-center justify-between border-b border-primary min-w-0">
      <div className="flex items-center min-w-0">
        <button onClick={toggleSidebar} className="md:hidden mr-4 p-2 rounded-md hover:bg-primary">
          <MenuIcon className="h-6 w-6 text-light" />
        </button>
        <h1 className="text-xl font-bold text-light truncate">{title}</h1>
      </div>
       <Link to="/config" className="text-xs text-muted hover:text-accent-green">Settings</Link>
    </header>
  );
};

export default HomeHeader;
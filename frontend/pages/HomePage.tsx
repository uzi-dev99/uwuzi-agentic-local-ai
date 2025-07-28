import React from 'react';
import HomeHeader from '../components/HomeHeader';
import ChatList from '../components/ChatList';
import { useChatStore } from '../contexts/ChatContext';
import FloatingActionButton from '../components/FloatingActionButton';

interface HomePageProps {
  activeFilter: {
    type: 'folder' | 'tag' | null;
    value: string | null;
  };
}

const HomePage: React.FC<HomePageProps> = ({ activeFilter }) => {
  const { folders } = useChatStore();

  let title = 'All Conversations';
  if (activeFilter.type === 'folder' && activeFilter.value) {
    const folder = folders.find(f => f.id === activeFilter.value);
    title = folder ? folder.name : 'Folder';
  } else if (activeFilter.type === 'tag' && activeFilter.value) {
    title = `Tag: #${activeFilter.value}`;
  }

  return (
    <div className="h-full w-full flex flex-col bg-primary relative">
      <HomeHeader title={title} />
      <ChatList activeFilter={activeFilter} />
      <FloatingActionButton />
    </div>
  );
};

export default HomePage;
import React from 'react';
import AnimatedPage from '../components/AnimatedPage';
import { useGesture } from 'react-use-gesture';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import HomeHeader from '../components/HomeHeader';
import ChatList from '../components/ChatList';
import { useChatStore } from '../contexts/ChatContext';
import { useSidebar } from '../contexts/SidebarContext';


interface HomePageProps {
  activeFilter: {
    type: 'folder' | 'tag' | null;
    value: string | null;
  };
}

const HomePage: React.FC<HomePageProps> = ({ activeFilter }) => {
  const { folders } = useChatStore();
  const { toggleSidebar } = useSidebar();

  const bind = useGesture({
    onDrag: ({ down, movement: [mx], direction: [dx], velocity }) => {
      if (down && dx > 0 && mx > 100 && velocity > 0.5) {
        // Provide haptic feedback when gesture is detected
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
          // Haptics might not be available in browser environment
          console.log('Haptics not available');
        });
        toggleSidebar();
      }
    },
  });

  let title = 'All Conversations';
  if (activeFilter.type === 'folder' && activeFilter.value) {
    const folder = folders.find(f => f.id === activeFilter.value);
    title = folder ? folder.name : 'Folder';
  } else if (activeFilter.type === 'tag' && activeFilter.value) {
    title = `Tag: #${activeFilter.value}`;
  }

  return (
    <AnimatedPage>
      <div {...bind()} className="flex flex-col h-full w-full bg-primary relative touch-pan-y">
        <HomeHeader title={title} />
        <div className="flex-1 overflow-y-auto min-h-0">
          <ChatList activeFilter={activeFilter} />
        </div>
      </div>
    </AnimatedPage>
  );
};

export default HomePage;